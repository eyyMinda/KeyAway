-- Analytics store: tracking sessions + events, visitors, key reports.
-- Moved out of Sanity (trackingSession*, visitor*, keyReport*). Run once in the Supabase SQL editor.
-- Access is server-side only through the `postgres` role (table owner). The schema is not exposed
-- to the Data API, and RLS without policies blocks anon/authenticated if it ever is.

create schema if not exists analytics;

-- Visitors: one row per visitor hash --------------------------------------------
create table if not exists analytics.visitors (
  visitor_hash       text primary key,
  visit_count        integer not null default 0,
  last_activity_at   timestamptz,
  visit_tier         text not null default 'new',
  is_spammer         boolean not null default false,
  spam_marked_at     timestamptz,
  report_count       integer not null default 0,
  suggestion_count   integer not null default 0,
  comment_count      integer not null default 0,
  contribution_score integer not null default 0,
  country            text,
  city               text,
  geo_updated_at     timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  origin             text not null default 'live',  -- live | sanity_seed | sanity_live | sanity_bundle
  sanity_ref         text,
  extra              jsonb
);
create index if not exists visitors_last_activity_idx on analytics.visitors (last_activity_at);

-- Older copies of a visitor found in Sanity bundles (the newest copy lives in `visitors`).
create table if not exists analytics.visitor_snapshots (
  sanity_ref   text primary key,
  visitor_hash text not null,
  data         jsonb not null,
  imported_at  timestamptz not null default now()
);
create index if not exists visitor_snapshots_hash_idx on analytics.visitor_snapshots (visitor_hash);

-- Sessions: one visit (30 min idle / 2 h / 100 events cap) -------------------------
create table if not exists analytics.sessions (
  id                 uuid primary key,
  visitor_hash       text not null,
  started_at         timestamptz not null,
  last_event_at      timestamptz not null,
  entry              text,
  referrer           text,
  landing_path       text,
  user_agent         text,
  country            text,
  city               text,
  utm_source         text,
  utm_medium         text,
  utm_campaign       text,
  event_count        integer not null default 0,
  report_count       integer not null default 0,
  contribution_count integer not null default 0,
  origin             text not null default 'live',  -- live | sanity_live | sanity_bundle | sanity_migration
  sanity_ref         text,
  extra              jsonb
);
create index if not exists sessions_visitor_idx    on analytics.sessions (visitor_hash, last_event_at desc);
create index if not exists sessions_started_idx    on analytics.sessions (started_at desc);
create index if not exists sessions_last_event_idx on analytics.sessions (last_event_at);

-- Events: rows inside a session ------------------------------------------------------
create table if not exists analytics.events (
  id                uuid primary key,
  session_id        uuid not null references analytics.sessions (id) on delete cascade,
  event             text not null,
  created_at        timestamptz not null,
  path              text,
  program_slug      text,
  not_found         boolean not null default false,
  key               text,
  label             text,
  social            text,
  activation_url    text,
  program_flow      text,
  listed_version    text,
  tried_version_fit text,
  tried_version     text,
  source_id         text,
  extra             jsonb
);
create index if not exists events_created_idx       on analytics.events (created_at desc);
create index if not exists events_session_idx       on analytics.events (session_id, created_at);
create index if not exists events_program_event_idx on analytics.events (program_slug, event) where program_slug is not null;
create index if not exists events_social_idx        on analytics.events (social) where event = 'social_click';

-- Key reports ----------------------------------------------------------------------
create table if not exists analytics.key_reports (
  id                uuid primary key default gen_random_uuid(),
  sanity_id         text unique,                 -- keyReport _id (bundled rows: their sourceId)
  event_type        text not null,
  program_slug      text,
  key               text,
  label             text,
  path              text,
  referrer          text,
  user_agent        text,
  country           text,
  city              text,
  utm_source        text,
  utm_medium        text,
  utm_campaign      text,
  ip_hash           text,
  listed_version    text,
  tried_version_fit text,
  tried_version     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz,                 -- set when changed here; imports never overwrite those rows
  origin            text not null default 'live', -- live | sanity_live | sanity_bundle
  sanity_ref        text,
  extra             jsonb
);
create index if not exists key_reports_program_idx on analytics.key_reports (program_slug, event_type);
create index if not exists key_reports_created_idx on analytics.key_reports (created_at desc);
create index if not exists key_reports_owner_idx   on analytics.key_reports (ip_hash, program_slug, key);

-- Sanity docs with no table of their own (e.g. the old analyticsMigration bookkeeping doc).
create table if not exists analytics.legacy_documents (
  sanity_id   text primary key,
  type        text not null,
  doc         jsonb not null,
  imported_at timestamptz not null default now()
);

create table if not exists analytics.migration_runs (
  id          bigserial primary key,
  export_file text not null,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  report      jsonb
);

alter table analytics.visitors          enable row level security;
alter table analytics.visitor_snapshots enable row level security;
alter table analytics.sessions          enable row level security;
alter table analytics.events            enable row level security;
alter table analytics.key_reports       enable row level security;
alter table analytics.legacy_documents  enable row level security;
alter table analytics.migration_runs    enable row level security;

-- Tier rules. Mirrors src/lib/visitors/visitTier.ts (resolveVisitTier). -------------
create or replace function analytics.visit_tier(p_visits integer, p_score integer, p_spammer boolean)
returns text
language sql
immutable
as $$
  select case
    when not coalesce(p_spammer, false) and p_visits >= 16 and p_score >= 5 then 'star'
    when p_visits <= 1 then 'new'
    when p_visits <= 5 then 'returning'
    else 'regular'
  end
$$;

-- Append events to the visitor's open session, or start one. Port of appendTrackingSession.
-- One call per tracked batch; the advisory lock stops parallel requests from opening twin sessions.
create or replace function analytics.append_session(
  p_visitor_hash text,
  p_requested_id uuid,
  p_session      jsonb,     -- { userAgent, country, city, entry, referrer, landingPath, utmSource, utmMedium, utmCampaign }
  p_events       jsonb,     -- [{ id, event, createdAt, path, programSlug, notFound, key, label, social, activationUrl, programFlow, listedVersion, triedVersionFit, triedVersion, sourceId }]
  p_idle         interval,
  p_max_age      interval,
  p_max_events   integer,
  p_near_dup     interval
)
returns table (session_id uuid, rotated boolean, inserted integer)
language plpgsql
as $$
declare
  v_now      timestamptz := now();
  v_id       uuid;
  v_rotated  boolean := false;
  v_open     analytics.sessions%rowtype;
  v_count    integer;
  v_reports  integer;
  v_contrib  integer;
  v_first    timestamptz;
  v_last     timestamptz;
  v_rows     jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_visitor_hash, 0));

  select * into v_open
  from analytics.sessions s
  where s.visitor_hash = p_visitor_hash
    and s.last_event_at >= v_now - p_idle
    and s.started_at >= v_now - p_max_age
    and s.event_count < p_max_events
  order by s.started_at asc
  limit 1;

  if found then
    v_id := v_open.id;
    v_rotated := p_requested_id is not null and p_requested_id <> v_id;
  elsif p_requested_id is not null then
    select * into v_open from analytics.sessions s where s.id = p_requested_id;
    if found and (v_open.last_event_at < v_now - p_idle
                  or v_open.started_at < v_now - p_max_age
                  or v_open.event_count >= p_max_events) then
      v_id := gen_random_uuid();
      v_rotated := true;
    else
      v_id := p_requested_id;
    end if;
  else
    v_id := gen_random_uuid();
  end if;

  -- Drop near-duplicates of the session's last two events (double taps, refresh spam).
  select coalesce(jsonb_agg(x.e order by x.n), '[]'::jsonb),
         count(*),
         count(*) filter (where x.e->>'event' like 'report\_%'),
         count(*) filter (where x.e->>'event' like 'report\_%'
                          or x.e->>'event' in ('comment', 'comment_reply', 'key_suggestion', 'contact')),
         min((x.e->>'createdAt')::timestamptz),
         max((x.e->>'createdAt')::timestamptz)
  into v_rows, v_count, v_reports, v_contrib, v_first, v_last
  from jsonb_array_elements(p_events) with ordinality as x(e, n)
  where not exists (
    select 1
    from (
      select e.event, e.created_at, e.path, e.program_slug, e.key, e.social
      from analytics.events e
      where e.session_id = v_id
      order by e.created_at desc
      limit 2
    ) r
    where r.event = x.e->>'event'
      and coalesce(r.path, '') = coalesce(x.e->>'path', '')
      and coalesce(r.program_slug, '') = coalesce(x.e->>'programSlug', '')
      and coalesce(r.key, '') = coalesce(x.e->>'key', '')
      and coalesce(r.social, '') = coalesce(x.e->>'social', '')
      and abs(extract(epoch from ((x.e->>'createdAt')::timestamptz - r.created_at))) <= extract(epoch from p_near_dup)
  );

  if v_count = 0 then
    return query select v_id, v_rotated, 0;
    return;
  end if;

  insert into analytics.sessions (id, visitor_hash, started_at, last_event_at, entry, referrer, landing_path,
                                  user_agent, country, city, utm_source, utm_medium, utm_campaign)
  values (v_id, p_visitor_hash, v_first, v_last,
          p_session->>'entry', p_session->>'referrer', p_session->>'landingPath', p_session->>'userAgent',
          p_session->>'country', p_session->>'city',
          p_session->>'utmSource', p_session->>'utmMedium', p_session->>'utmCampaign')
  on conflict (id) do nothing;

  insert into analytics.events (id, session_id, event, created_at, path, program_slug, not_found, key, label, social,
                                activation_url, program_flow, listed_version, tried_version_fit, tried_version, source_id)
  select x.id, v_id, x.event, x."createdAt", x.path, x."programSlug", coalesce(x."notFound", false), x.key, x.label,
         x.social, x."activationUrl", x."programFlow", x."listedVersion", x."triedVersionFit", x."triedVersion", x."sourceId"
  from jsonb_to_recordset(v_rows) as x(
    id uuid, event text, "createdAt" timestamptz, path text, "programSlug" text, "notFound" boolean, key text,
    label text, social text, "activationUrl" text, "programFlow" text, "listedVersion" text,
    "triedVersionFit" text, "triedVersion" text, "sourceId" text
  )
  on conflict (id) do nothing;

  update analytics.sessions s set
    event_count        = s.event_count + v_count,
    report_count       = s.report_count + v_reports,
    contribution_count = s.contribution_count + v_contrib,
    last_event_at      = greatest(s.last_event_at, v_last),
    country            = coalesce(s.country, p_session->>'country'),
    city               = coalesce(s.city, p_session->>'city'),
    landing_path       = coalesce(s.landing_path, p_session->>'landingPath')
  where s.id = v_id;

  return query select v_id, v_rotated, v_count;
end
$$;
