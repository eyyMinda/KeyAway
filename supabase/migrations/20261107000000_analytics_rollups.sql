-- Daily rollups for analytics, so raw sessions/events only need to be kept for a short window.
-- Each day older than the window is folded into `daily_stats` (counts) and `daily_sketches` (distinct visitors),
-- then its high-volume events (page views, key copies, downloads) and their emptied sessions are deleted.
-- Rare events (reports, comments, suggestions, contact, social/promo/affiliate clicks, pro account copies) and
-- their sessions are never deleted. Run once in the Supabase SQL editor; idempotent.

-- Counts per UTC day. Metrics mirror the admin queries in src/lib/analytics/sessionAdmin.ts:
--   event (key = event), not_found, program (slug), path, social, country, visitors   -> dashboard summary
--   tl_visitors, tl_views, tl_actions, tl_tier (tier), tl_page (page type), tl_action, tl_promo (placement) -> timeline
--   prog_view, prog_download (slug)                                                   -> program stats cron
--   source (entry \x1f referrer), sessions started that day                            -> sources table
--   visitor_pruned (tier), one-time visitors deleted, by their last activity day      -> visitor tier counts
create table if not exists analytics.daily_stats (
  day    date    not null,
  metric text    not null,
  key    text    not null default '',
  n      integer not null,
  primary key (day, metric, key)
);
create index if not exists daily_stats_metric_idx on analytics.daily_stats (metric, day);

-- Distinct visitors per day as HyperLogLog sketches (1024 one-byte registers, ~3% error when merged), so
-- multi-day "unique visitors" can be counted without keeping visitor hashes. Single days use the exact counts.
create table if not exists analytics.daily_sketches (
  day    date  not null,
  metric text  not null,  -- visitors | tl_visitors | tl_tier
  key    text  not null default '',
  regs   bytea not null,
  primary key (day, metric, key)
);

-- Every day before `rolled_until` is in the rollups; raw rows on those days are no longer counted.
create table if not exists analytics.rollup_state (
  id           boolean primary key default true check (id),
  rolled_until date not null default '1970-01-01'
);
insert into analytics.rollup_state (id) values (true) on conflict (id) do nothing;

alter table analytics.daily_stats    enable row level security;
alter table analytics.daily_sketches enable row level security;
alter table analytics.rollup_state   enable row level security;

-- HyperLogLog helpers -------------------------------------------------------------------
create or replace function analytics.hll_index(p_value text) returns integer
language sql immutable parallel safe
as $$ select (hashtextextended(p_value, 0) & 1023)::int $$;

-- Position of the first 1 bit in the remaining 54 hash bits (casting to bit(n) keeps the rightmost n bits).
create or replace function analytics.hll_rank(p_value text) returns integer
language sql immutable parallel safe
as $$ select coalesce(nullif(position('1' in ((hashtextextended(p_value, 0) >> 10)::bit(54))::text), 0), 55) $$;

create or replace function analytics.hll_sketch(p_values text[]) returns bytea
language sql immutable parallel safe
as $$
  with r as (
    select analytics.hll_index(v) as i, max(analytics.hll_rank(v)) as r
    from unnest(p_values) as v
    where v is not null
    group by 1
  )
  select decode(string_agg(lpad(to_hex(coalesce(r.r, 0)), 2, '0'), '' order by g.i), 'hex')
  from generate_series(0, 1023) as g(i)
  left join r on r.i = g.i
$$;

create or replace function analytics.hll_merge(p_a bytea, p_b bytea) returns bytea
language sql immutable strict parallel safe
as $$
  select decode(string_agg(lpad(to_hex(greatest(get_byte(p_a, i), get_byte(p_b, i))), 2, '0'), '' order by i), 'hex')
  from generate_series(0, 1023) as i
$$;

create or replace aggregate analytics.hll_union(bytea) (
  sfunc = analytics.hll_merge,
  stype = bytea
);

-- Estimate with the small-range (linear counting) correction; 64-bit hashes need no large-range one.
create or replace function analytics.hll_count(p_regs bytea) returns integer
language sql immutable parallel safe
as $$
  select case
    when p_regs is null then 0
    when t.raw <= 2.5 * 1024 and t.zeros > 0 then round(1024 * ln(1024.0 / t.zeros))::int
    else round(t.raw)::int
  end
  from (
    select (0.7213 / (1 + 1.079 / 1024)) * 1024 * 1024 / sum(power(2::float8, -get_byte(p_regs, i))) as raw,
           count(*) filter (where get_byte(p_regs, i) = 0) as zeros
    from generate_series(0, 1023) as i
  ) t
$$;

-- Fold one UTC day into the rollups, then delete its high-volume events and emptied sessions. --------------
-- Only called by analytics.rollup_next_day, which keeps days in order; never run it twice for one day.
create or replace function analytics.rollup_day(p_day date)
returns jsonb
language plpgsql
as $$
declare
  v_from      timestamptz := p_day::timestamp at time zone 'UTC';
  v_to        timestamptz := (p_day + 1)::timestamp at time zone 'UTC';
  -- Contributions have their own admin pages; the timeline leaves them out (CHART_EXCLUDED in sessionAdmin.ts).
  v_excluded  text[] := array['comment', 'comment_reply', 'key_suggestion', 'contact'];
  v_events    integer;
  v_sessions  integer;
begin
  create temp table rollup_ev on commit drop as
    select e.event, e.path, e.program_slug, e.not_found, e.social, s.country, s.visitor_hash,
           coalesce(v.visit_tier, 'new') as tier,
           e.event = any (v_excluded) as excluded
    from analytics.events e
    join analytics.sessions s on s.id = e.session_id
    left join analytics.visitors v on v.visitor_hash = s.visitor_hash
    where e.created_at >= v_from and e.created_at < v_to
      and e.event not like 'report\_%';

  insert into analytics.daily_stats as d (day, metric, key, n)
  select p_day, t.metric, t.key, t.n
  from (
    select 'event' as metric, event as key, count(*) as n from rollup_ev group by event
    union all
    select 'not_found', '', count(*) from rollup_ev where event = 'page_viewed' and not_found having count(*) > 0
    union all
    select 'program', program_slug, count(*) from rollup_ev
    where program_slug is not null and not (event = 'page_viewed' and not_found) group by program_slug
    union all
    select 'path', path, count(*) from rollup_ev
    where path is not null and not (event = 'page_viewed' and not_found) group by path
    union all
    select 'social', social, count(*) from rollup_ev
    where event = 'social_click' and social is not null and social not like 'promo-%' group by social
    union all
    select 'country', country, count(*) from rollup_ev where country is not null group by country
    union all
    select 'visitors', '', count(distinct visitor_hash) from rollup_ev having count(*) > 0
    union all
    select 'prog_view', program_slug, count(*) from rollup_ev
    where event = 'page_viewed' and not not_found and program_slug is not null group by program_slug
    union all
    select 'prog_download', program_slug, count(*) from rollup_ev
    where event = 'download_click' and program_slug is not null group by program_slug
    union all
    select 'tl_visitors', '', count(distinct visitor_hash) from rollup_ev where not excluded having count(*) > 0
    union all
    select 'tl_views', '', count(*) from rollup_ev where not excluded and event = 'page_viewed' having count(*) > 0
    union all
    select 'tl_actions', '', count(*) from rollup_ev where not excluded and event <> 'page_viewed' having count(*) > 0
    union all
    select 'tl_tier', tier, count(distinct visitor_hash) from rollup_ev where not excluded group by tier
    union all
    select 'tl_page',
           case
             when path = '/' then 'home'
             when path = '/programs' then 'catalog'
             when path like '/program/%' then 'program'
             when path like '/vendors%' then 'vendor'
             else 'other'
           end,
           count(*)
    from rollup_ev where not excluded and event = 'page_viewed' group by 2
    union all
    select 'tl_action', case when social like 'promo-%' then 'promo_click' else event end, count(*)
    from rollup_ev where not excluded and event <> 'page_viewed' group by 2
    union all
    select 'tl_promo', substr(social, 7), count(*) from rollup_ev
    where not excluded and social like 'promo-%' group by 2
    union all
    select 'source', coalesce(s.entry, '') || chr(31) || coalesce(s.referrer, ''), count(*)
    from analytics.sessions s
    where s.started_at >= v_from and s.started_at < v_to
    group by 2
  ) t
  on conflict (day, metric, key) do update set n = d.n + excluded.n;

  insert into analytics.daily_sketches (day, metric, key, regs)
  select p_day, 'visitors', '', analytics.hll_sketch(array_agg(distinct visitor_hash))
  from rollup_ev having count(*) > 0
  union all
  select p_day, 'tl_visitors', '', analytics.hll_sketch(array_agg(distinct visitor_hash))
  from rollup_ev where not excluded having count(*) > 0
  union all
  select p_day, 'tl_tier', tier, analytics.hll_sketch(array_agg(distinct visitor_hash))
  from rollup_ev where not excluded group by tier
  on conflict (day, metric, key) do update set regs = analytics.hll_merge(analytics.daily_sketches.regs, excluded.regs);

  delete from analytics.events
  where created_at >= v_from and created_at < v_to
    and event in ('page_viewed', 'copy_cdkey', 'download_click');
  get diagnostics v_events = row_count;

  -- Sessions that started up to this day and have nothing left (a visit can run past midnight).
  delete from analytics.sessions s
  where s.started_at < v_to
    and not exists (select 1 from analytics.events e where e.session_id = s.id);
  get diagnostics v_sessions = row_count;

  return jsonb_build_object('day', p_day, 'events', v_events, 'sessions', v_sessions);
end
$$;

-- Roll up the oldest day not yet rolled, if it is older than the raw window. Returns null when caught up.
create or replace function analytics.rollup_next_day(p_raw_days integer)
returns jsonb
language plpgsql
as $$
declare
  v_cutoff date := (now() at time zone 'UTC')::date - p_raw_days;
  v_until  date;
  v_day    date;
  v_result jsonb;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('analytics.rollup', 0)) then
    return null;
  end if;

  select rolled_until into v_until from analytics.rollup_state where id;

  select (min(e.created_at) at time zone 'UTC')::date into v_day
  from analytics.events e
  where e.created_at >= v_until::timestamp at time zone 'UTC'
    and e.created_at < v_cutoff::timestamp at time zone 'UTC';

  if v_day is null then
    -- Nothing raw before the window: the remaining days up to the cutoff are empty.
    update analytics.rollup_state set rolled_until = greatest(rolled_until, v_cutoff) where id;
    return null;
  end if;

  v_result := analytics.rollup_day(v_day);
  update analytics.rollup_state set rolled_until = v_day + 1 where id;
  return v_result;
end
$$;

-- One-time visitors with no contributions, inactive for the raw window. Counted per last-activity day and tier so
-- visitor tier totals stay the same; spammers and anyone who reported, commented or suggested are always kept.
create or replace function analytics.prune_visitors(p_raw_days integer)
returns integer
language plpgsql
as $$
declare
  v_cutoff timestamptz := ((now() at time zone 'UTC')::date - p_raw_days)::timestamp at time zone 'UTC';
  v_count  integer;
begin
  with gone as (
    delete from analytics.visitors v
    where v.visit_count <= 1
      and not v.is_spammer
      and v.report_count = 0 and v.suggestion_count = 0 and v.comment_count = 0 and v.contribution_score = 0
      and coalesce(v.last_activity_at, v.created_at) < v_cutoff
    returning (coalesce(v.last_activity_at, v.created_at) at time zone 'UTC')::date as day,
              coalesce(lower(v.visit_tier), 'new') as tier
  ), counted as (
    insert into analytics.daily_stats as d (day, metric, key, n)
    select day, 'visitor_pruned', tier, count(*) from gone group by day, tier
    on conflict (day, metric, key) do update set n = d.n + excluded.n
    returning n
  )
  select count(*) into v_count from gone;
  return v_count;
end
$$;
