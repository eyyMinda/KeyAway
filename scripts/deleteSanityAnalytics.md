# Sanity analytics cleanup (one-off, delete after use)

Analytics now live in Supabase. This removes the old copies from Sanity.

**Before:** keep both export tarballs (`backups/`) somewhere outside the repo, and narrow the Sanity revalidate
webhook filter to content types (sanity.io/manage → API → Webhooks). Otherwise each deleted document fires a webhook.

1. Dry run (counts only):
   ```bash
   npm run cleanup:sanity-analytics
   ```
2. Delete. It checks Supabase has the imported history first:
   ```bash
   npm run cleanup:sanity-analytics -- --confirm
   ```
3. Merge the PR (removes the analytics schemas, Studio entries and the Sanity visitor seeding).
4. Remove `ANALYTICS_SANITY_SEEDING` from Vercel (no redeploy needed; nothing reads it anymore).
5. Delete `scripts/deleteSanityAnalytics.mjs`, this file, and the `cleanup:sanity-analytics` npm script.

Deletes: `trackingSession`, `trackingSessionBundle`, `visitor`, `visitorBundle`, `keyReport`, `keyReportBundle`,
`analyticsMigration`, any leftover legacy event types, and `cronRun` logs of the removed `bundle-*` jobs.
