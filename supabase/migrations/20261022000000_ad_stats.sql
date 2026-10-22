-- Ad performance counters. No per-event rows: browsers batch their counts and each batch is added onto these
-- rows, so the tables stay small (days x pages x placements, and paths x placements). Run once in the Supabase
-- SQL editor; idempotent.

-- Per day, per page type and placement: trends and the admin page snapshot.
create table if not exists analytics.ad_stats_daily (
  day       date    not null,
  page      text    not null,  -- home | programs | program | vendors | vendor | other (see src/lib/ads/adPlacements.ts)
  placement text    not null,
  unit      text    not null,  -- banner | native | card | rail | link
  loads     integer not null default 0,  -- unit started loading (slot visible, consent given)
  fills     integer not null default 0,  -- an ad actually rendered
  views     integer not null default 0,  -- rendered ad was at least half on screen for 1 second
  clicks    integer not null default 0,  -- estimated: focus moved into the ad frame, or a link in it was clicked
  primary key (day, page, placement, unit)
);
create index if not exists ad_stats_daily_page_idx on analytics.ad_stats_daily (page, day);

-- All-time totals per concrete path (e.g. one program page) and placement.
create table if not exists analytics.ad_stats_paths (
  path          text        not null,
  placement     text        not null,
  unit          text        not null,
  page          text        not null,
  loads         integer     not null default 0,
  fills         integer     not null default 0,
  views         integer     not null default 0,
  clicks        integer     not null default 0,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  primary key (path, placement, unit)
);
create index if not exists ad_stats_paths_page_idx on analytics.ad_stats_paths (page, views desc);

alter table analytics.ad_stats_daily enable row level security;
alter table analytics.ad_stats_paths enable row level security;
