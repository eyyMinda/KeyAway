-- Browser identifiers (user agents) stored once: sessions point to analytics.user_agents instead of repeating the
-- full string (~120 bytes) on every session. A user agent can be flagged as a bot from the admin dashboard; tracking
-- then skips it. Run once in the Supabase SQL editor, at deploy time (the old code reads sessions.user_agent);
-- idempotent. Afterwards run `vacuum full analytics.sessions;` to reclaim the space.

create table if not exists analytics.user_agents (
  id            serial      primary key,
  ua            text        not null unique,
  is_bot        boolean     not null default false,
  marked_at     timestamptz,
  first_seen_at timestamptz not null default now()
);
alter table analytics.user_agents enable row level security;

alter table analytics.sessions add column if not exists user_agent_id integer references analytics.user_agents (id);

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'analytics' and table_name = 'sessions' and column_name = 'user_agent') then
    insert into analytics.user_agents (ua)
    select distinct left(user_agent, 500) from analytics.sessions where nullif(user_agent, '') is not null
    on conflict (ua) do nothing;

    update analytics.sessions s set user_agent_id = u.id
    from analytics.user_agents u
    where s.user_agent_id is null and u.ua = left(s.user_agent, 500);

    alter table analytics.sessions drop column user_agent;
  end if;
end
$$;

-- Same as the analytics migration, except new sessions store user_agent_id.
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
  v_ua       text;
  v_ua_id    integer;
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

  -- A new session stores its browser identifier once in user_agents and points to it.
  if not exists (select 1 from analytics.sessions s where s.id = v_id) and nullif(p_session->>'userAgent', '') is not null then
    v_ua := left(p_session->>'userAgent', 500);
    insert into analytics.user_agents (ua) values (v_ua) on conflict (ua) do nothing;
    select u.id into v_ua_id from analytics.user_agents u where u.ua = v_ua;
  end if;

  insert into analytics.sessions (id, visitor_hash, started_at, last_event_at, entry, referrer, landing_path,
                                  user_agent_id, country, city, utm_source, utm_medium, utm_campaign)
  values (v_id, p_visitor_hash, v_first, v_last,
          p_session->>'entry', p_session->>'referrer', p_session->>'landingPath', v_ua_id,
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
