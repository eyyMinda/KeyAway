# Key status updates

How CD key and activation-entry statuses change over time without manual edits. Paths are from the repo root.

## Rules

Each entry has a `status` (`new`, `active`, `expired`, `limit`) and optional `validFrom`, `validUntil` and `createdAt` dates.

| Rule | Result |
| --- | --- |
| `validUntil` is in the past and the status is not `expired` | `expired` |
| Status is `new` and the entry was added (`createdAt`, else `validFrom`) more than 30 days ago | `active` |

An empty `validUntil` means a lifetime key that never expires by date. `limit` is set by hand (or from visitor reports) when a key's activations run out.

## Two places apply them

1. **On display:** program pages apply the rules in memory before rendering. `getProgramBySlug` in `src/lib/sanity/sanityActions.ts` calls `applyKeyStatusForDisplay` (`src/lib/program/applyKeyStatusForDisplay.ts`). A key that expired an hour ago already shows as expired, even though Sanity hasn't been updated yet. Nothing is written on page load.
2. **Nightly write:** `/api/v1/cron/update-expired-keys` runs at 22:00 UTC (`vercel.json`). It calls `updateAllExpiredKeys`, which applies the same rules to every program and saves the programs whose keys changed. Each run is logged as a `cronRun` document and shown on the admin dashboard under Cron Jobs.

## Triggering a run manually

- `POST /api/v1/cron/update-expired-keys` with an admin session, or with `Authorization: Bearer $CRON_SECRET`.
- Vercel's scheduled runs send the same `Authorization: Bearer $CRON_SECRET` header (Vercel adds it when `CRON_SECRET` is set).

## Related

- Visitor reports (`/api/v1/key-reports`) flag keys that stopped working before their date. Admin → Key reports lists them; the dashboard's key report review (below) points out which keys need a status change.
- The giveaway finder and the admin Keys tab add new entries with status `new` and a `createdAt` date, so they move to `active` after 30 days.

## Key report review (dashboard)

`src/lib/admin/keyReview.ts` reads the last 30 days of reports and answers two questions. The dashboard alerts open
the review dialog, where a suggested status can be applied in one click.

**Weighting.** Each report counts by how recent it is (half-life 10 days) and how far its visitor can be trusted:
flagged spammers count for nothing, new visitors 0.7, returning 0.9, regular 1, star 1.2, and a visitor who reported
many keys broken within a day half as much. Each visitor counts once per key (a renewed report replaces the old one).

**Keys that need a status change** (needs reports from at least 3 different visitors):

- *Broken on its listed version:* expired / limit reached reports on the listed version make up 60%+ of the weighted
  reports, or the 3 most recent reports all fail. Suggests whichever of expired / limit reached weighs more.
- *Outdated for the latest version:* visitors tried the program's latest official version, the key is listed for an
  older one, and it failed (40%+ against the working reports). Most people download the latest version, so this is a
  reason to update the key, not a sign of false reports.
- *Valid-until passed* while the key is still active.
- *Reactivate:* a key marked expired / limit reached that recent visitors (70%+, including the 3 most recent) report
  working.

High confidence needs a clear majority from more visitors (80%+ and 5+ visitors, or 8+ on the latest version).

**Doubtful reports:** from a flagged spammer; from a visitor who reported 6+ keys broken in a day, or 4+ across 3+
programs; a failure on the listed version that 5+ other visitors contradicted afterwards while the key works for 85%+
of the weighted reports (mixed results are normal for shared keys); or a "tried version" newer than the latest
official one (or the recorded latest version is out of date).
