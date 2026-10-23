# Visitors, tiers and spammers

How visitor identity, visit counts, tiers ("tags") and the spammer flag work. Visitors are rows in the Supabase table `analytics.visitors`; all reads and writes go through `src/lib/visitors/visitorStore.ts`. Paths are from the repo root.

## Identity

- A visitor is identified by `visitor_hash`: a SHA-256 hash of the client IP plus `ANALYTICS_SALT` (`src/lib/api/requestGeo.ts`). The raw IP is never stored.
- Sessions, events and key reports store the same hash, so admin views can join them to the visitor.
- It is not a cookie or an account: people on one network can share a hash, and a VPN or mobile IP change gives a new one.

## When a visitor row is written

| Trigger | Function | Effect |
| --- | --- | --- |
| A stored `page_viewed` (`POST /api/v1/analytics/track`) | `upsertVisitorOnPageView` | Creates the row (`visit_count = 1`, tier `new`), or counts a new visit when the last activity is 30+ minutes old; also records country/city from Vercel's geo headers |
| A key report, key suggestion or program comment | `upsertVisitorContribution` | Increments `report_count`, `suggestion_count` or `comment_count` and `contribution_score`, then recomputes the tier |
| Admin marks or unmarks a spammer (`PATCH /api/v1/admin/visitor-spammer`) | `setVisitorSpammer` | Sets `is_spammer` / `spam_marked_at`; creates the row if needed |

- **Visits:** page views less than 30 minutes apart count as the same visit, so `visit_count` counts visits, not page views.
- **Localhost:** the track route skips localhost, so local development creates no visitor rows.
- **Errors:** a failed visitor upsert is logged and doesn't fail the request.

## Tiers

The tier is computed in SQL by `analytics.visit_tier(visits, score, spammer)` every time the row changes (`supabase/migrations/`). The TypeScript copy, used for display, is `resolveVisitTier` in `src/lib/visitors/visitTier.ts`.

| Tier | Rule |
| --- | --- |
| `new` | 1 visit or fewer |
| `returning` | 2–5 visits |
| `regular` | 6+ visits |
| `star` | 16+ visits **and** contribution score 5+, and not a spammer |

## Spammers

- **Flagging:** done by an admin from session, visitor and comment views (`MarkSpammerButton`).
- **Key reports:** reports from a flagged visitor are accepted but not stored, except "working" confirmations.
- **Public pages:** `getVisitorContextForPublicPage` (`src/lib/visitors/serverVisitorContext.ts`) returns `isSpammer`. The key table then disables report actions (`isSpammerVisitor` on `CDKeyTable`), and no tier hint is shown.

## Where tiers show up

| Surface | Behaviour |
| --- | --- |
| Homepage hero and program pages | A small tier hint (`VisitorTierHint`) with copy from `buildVisitorHintData`; see [tag-based-content.md](tag-based-content.md) |
| Admin sessions, visitor details, comments | Tier, contribution counts, location and spammer flag looked up by hash |
| Admin analytics, "Visitor tags" | `fetchVisitorTagAggregates`: visitors whose last activity falls in the selected range, counted by their current tier, plus a "Spammers (flagged)" row (`/api/v1/admin/analytics/visitor-tiers`) |

## Columns (`analytics.visitors`)

| Column | Role |
| --- | --- |
| `visitor_hash` | Primary key |
| `visit_count` | Visits (30-minute gap rule) |
| `last_activity_at` | Last page view or contribution |
| `visit_tier` | Current tier, recomputed on every write |
| `report_count`, `suggestion_count`, `comment_count`, `contribution_score` | Contributions |
| `is_spammer`, `spam_marked_at` | Admin flag |
| `country`, `city`, `geo_updated_at` | Approximate location from the request |

## Related files

- `src/lib/visitors/visitorStore.ts`: all visitor queries
- `src/lib/visitors/visitTier.ts`: tier rules and contribution types
- `src/lib/visitors/serverVisitorContext.ts`, `buildVisitorHintData.ts`: public-page context and hint copy
- `src/app/api/v1/analytics/track/route.ts`: page views and key reports
- `src/app/api/v1/admin/visitor-spammer/route.ts`: spammer flag
- `supabase/migrations/`: table and `visit_tier` function
