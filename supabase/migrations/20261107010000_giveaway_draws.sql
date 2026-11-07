-- Facebook giveaway draws: prizes, entrants and the winners picked. One small row per giveaway: entrants are stored as
-- names plus the prizes they asked for (comment text is only kept for winners). Run once in the Supabase SQL editor;
-- idempotent. Admin-only, through the server like the rest of the analytics schema.

create table if not exists analytics.giveaway_draws (
  id         uuid        primary key default gen_random_uuid(),
  title      text        not null,
  kind       text,                                  -- free label, e.g. "Comment to win", "Holiday", "Milestone"
  post_url   text,
  status     text        not null default 'open',   -- open | drawn
  prizes     jsonb       not null default '[]',     -- [{ id, name, qty, aliases: [] }]
  entrants   jsonb       not null default '[]',     -- [{ n: name, p: [prizeId] }]
  winners    jsonb       not null default '[]',     -- [{ prize: prizeId, name, at, comment? }]
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  drawn_at   timestamptz,
  constraint giveaway_draws_size check (pg_column_size(entrants) + pg_column_size(winners) + pg_column_size(prizes) < 262144)
);
create index if not exists giveaway_draws_created_idx on analytics.giveaway_draws (created_at desc);

alter table analytics.giveaway_draws enable row level security;
