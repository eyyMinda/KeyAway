# Tag-based / visitor personalization (KeyAway)

This documents **where** tier- and contribution-driven copy lives today and **how** to change it later.

## Data source

- **`visitor`** documents in Sanity (`visitTier`, contribution counters, `isSpammer`, `visitCount`, `lastActivityAt`, …).
- Written on each production **`page_viewed`** in `POST /api/v1/analytics/track` via `upsertVisitorOnPageView` (`src/lib/visitors/upsertVisitorOnPageView.ts`).
- **Read path (public site):** `getVisitorContextForPublicPage(headers)` in `src/lib/visitors/serverVisitorContext.ts` — hashes IP (same salt as events), loads matching `visitor`, returns `visitorHint` and `isSpammer`.

## Where copy is injected

| Location | File | Behavior |
|----------|------|----------|
| Homepage hero | `src/app/page.tsx` → `HeroSection` | Passes `visitorHint` from `getVisitorContextForPublicPage`. |
| Hero UI | `src/components/home/HeroSection.tsx` | Renders `VisitorTierHint` (button + popover) when `visitorHint` is set. |
| Program page | `src/app/program/[slug]/page.tsx` | Same helper; passes `visitorHint` to `ProgramInformation` and `isSpammer` to `CDKeyTable`. |
| Program hero | `src/components/program/ProgramInformation.tsx` | Same `VisitorTierHint` when `visitorHint` is set. |
| Spammer UX | `CDKeyTable` / `CDKeyActions` | `isSpammerVisitor` greys/disables report actions; APIs return `skipped: true`. |

## Editing the messages

- **Code-only today:** popover copy is built in `buildVisitorHintData` (`src/lib/visitors/buildVisitorHintData.ts`); `getVisitorContextForPublicPage` loads the visitor doc and calls it.
- **To add CMS-driven promos later:** add Sanity types (e.g. snippets keyed by tier) and have `buildVisitorHintData` read from CMS instead of hardcoded strings.

## Admin / analytics

- **Visitor tiers & spam** show on event rows (GROQ join on `ipHash` in `trackingEventsWithRangeQuery`).
- **Dashboard:** “Visitor tags (by last activity in range)” table uses `fetchVisitorTagAggregatesForRange` (`src/lib/analytics/eventsApi.ts`) — counts tiers + **Spammers (flagged)** in one table.
