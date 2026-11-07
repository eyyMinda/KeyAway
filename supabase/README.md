# Analytics database (Supabase)

Visitor-driven data lives in the `analytics` schema of the KeyAway Supabase project: tracking sessions + events,
visitors, and key reports. Editorial content (programs, vendors, store details, changelog…) stays in Sanity.

| Table | Replaces (Sanity) |
|---|---|
| `analytics.sessions`, `analytics.events` | `trackingSession`, `trackingSessionBundle` |
| `analytics.visitors` (+ `visitor_snapshots` for older bundled copies) | `visitor`, `visitorBundle` |
| `analytics.key_reports` | `keyReport`, `keyReportBundle` |
| `analytics.legacy_documents` | `analyticsMigration` (kept verbatim) |

The app connects with [`postgres`](https://github.com/porsager/postgres) (`src/lib/db/postgres.ts`) through the
Supavisor **transaction pooler**. The schema is not exposed to the Data API, and RLS without policies blocks the
`anon` / `authenticated` roles.

## Setup

1. Supabase → SQL editor → run [`migrations/20261016000000_analytics.sql`](migrations/20261016000000_analytics.sql).
   It is idempotent.
2. Supabase → Connect → **Transaction pooler** URI (port `6543`). URL-encode the password.
   Add it as `SUPABASE_DB_URL` to `.env.local` and to Vercel (Production + Preview).
3. The Supabase region should be close to the Vercel function region (Vercel → Settings → Functions).

## History

Until October 2026 this data lived in Sanity. It was imported from a `sanity dataset export` on 2026-10-16
(identical copies left by the old bundling cron were skipped, so totals dropped to the real numbers). The import
script lives in git history (`scripts/migrateAnalyticsToSupabase.mjs`); the export tarballs are the original copy.
`origin` / `sanity_ref` on imported rows point back to the Sanity document or bundle row.

## Storage

The free plan allows 500 MB. The admin dashboard shows the database size and row growth per table
(`/api/v1/admin/analytics-db`).

### Rollups and the raw window

Raw sessions and events are kept for 30 days (`RAW_RETENTION_DAYS` in `src/lib/analytics/sessionConstants.ts`).
[`migrations/20261107000000_analytics_rollups.sql`](migrations/20261107000000_analytics_rollups.sql) adds:

| Table | Holds |
|---|---|
| `analytics.daily_stats` | Per UTC day: event totals, top programs / paths / socials / countries, session sources, timeline splits, program views and downloads, pruned one-time visitors per tier |
| `analytics.daily_sketches` | Per UTC day: distinct visitors as HyperLogLog sketches (1 KB), so multi-day unique visitors can be counted (~3% error) |
| `analytics.rollup_state` | `rolled_until`: every earlier day is in the rollups |

The daily `prune-cron-runs` cron calls `runAnalyticsRollup` (`src/lib/analytics/rollupStore.ts`). For each day older
than the window, oldest first, `analytics.rollup_next_day` writes that day's rollups, then deletes its page views, key
copies and downloads plus sessions left empty. Reports, comments, suggestions, contact messages, social / promo /
affiliate clicks and pro account copies are never deleted, nor are their sessions. `analytics.prune_visitors` deletes
one-time visitors with no contributions after the same window (spammers and contributors are kept).

Admin readers split a range into rolled days (from the rollups) and the raw remainder, so totals and top lists match
what raw rows gave. Rolled days count as whole days: a range that covers less than half of its first or last day
leaves that day out. Distinct visitors over several rolled days are estimates.

Deleted rows free space for new rows but do not shrink the files. After the first big rollup, run
`vacuum full analytics.events, analytics.sessions, analytics.visitors;` once in the SQL editor (it locks those tables
for a few seconds) so the reported database size drops.
