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
- Vercel's scheduled runs authenticate with the `x-vercel-cron` header.

## Related

- Visitor reports (`/api/v1/key-reports`) flag keys that stopped working before their date. Admin → Key reports lists them, and the admin header shows alerts for keys with negative reports that are still marked working.
- The giveaway finder and the admin Keys tab add new entries with status `new` and a `createdAt` date, so they move to `active` after 30 days.
