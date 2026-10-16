# Analytics database (Supabase)

Visitor-driven data lives in the `analytics` schema of the KeyAway Supabase project: tracking sessions + events,
visitors, and key reports. Editorial content (programs, vendors, store details, changelog…) stays in Sanity.

| Table | Replaces (Sanity) |
|---|---|
| `analytics.sessions`, `analytics.events` | `trackingSession`, `trackingSessionBundle` |
| `analytics.visitors` (+ `visitor_snapshots` for older bundled copies) | `visitor`, `visitorBundle` |
| `analytics.key_reports` | `keyReport`, `keyReportBundle` |
| `analytics.legacy_documents` | `analyticsMigration` |

The app connects with [`postgres`](https://github.com/porsager/postgres) (`src/lib/db/postgres.ts`) through the
Supavisor **transaction pooler**. The schema is not exposed to the Data API, and RLS without policies blocks the
`anon` / `authenticated` roles.

## Setup

1. Supabase → SQL editor → run [`migrations/20261016000000_analytics.sql`](migrations/20261016000000_analytics.sql).
   It is idempotent.
2. Supabase → Connect → **Transaction pooler** URI (port `6543`). URL-encode the password.
   Add it as `SUPABASE_DB_URL` to `.env.local` and to Vercel (Production + Preview).
3. The Supabase region should be close to the Vercel function region (Vercel → Settings → Functions).

## Cutover from Sanity

The import reads an extracted `sanity dataset export` file offline, so it spends no Sanity API quota. It is
idempotent, prints a report, writes `migration-report-*.json`, and checks that every exported record exists in
Postgres (exit code 1 otherwise).

1. **Pre-import history** from an existing export (sessions and reports only, so live visitor state is not frozen early):
   ```bash
   tar -xzf backups/sanity-production-<date>.tar.gz -C backups/
   npm run migrate:analytics -- --file backups/<export-dir>/data.ndjson --types sessions,keyReports,legacy
   ```
2. **Deploy** this branch with `SUPABASE_DB_URL` set. Analytics writes now go to Postgres. Until the final import,
   a visitor seen for the first time is copied from Sanity (`src/lib/visitors/sanityVisitorSeed.ts`), so tiers,
   counters and spam flags carry over.
3. **Wait ~15 minutes** for old instances to finish their last Sanity writes, then take the final export:
   ```bash
   npx sanity dataset export production backups/sanity-analytics-final.tar.gz --no-assets \
     --types trackingSession,trackingSessionBundle,keyReport,keyReportBundle,visitor,visitorBundle,analyticsMigration
   tar -xzf backups/sanity-analytics-final.tar.gz -C backups/
   npm run migrate:analytics -- --file backups/<final-export-dir>/data.ndjson
   ```
   Sessions that continued in Postgres are merged, and rows changed in Postgres after the cutover are never overwritten.
4. When the report says `OK`, set `ANALYTICS_SANITY_SEEDING=off` on Vercel and redeploy.
5. Keep both export tarballs in two places. After a quiet period, delete the analytics documents from Sanity and
   remove their schemas, Studio structure entries and `sanityVisitorSeed.ts`.

### Numbers that change on purpose

The old bundling cron sometimes copied the same rows into several bundles. The import keeps one copy of each, and
the report lists every copy it skipped (`skipped.duplicateSessionCopies`, `skipped.duplicateKeyReportCopies`).
Totals that counted those copies (for example homepage "total reports") drop to the real numbers.

## Storage

The free plan allows 500 MB. The admin dashboard shows the database size and row growth per table
(`/api/v1/admin/analytics-db`).
