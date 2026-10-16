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
