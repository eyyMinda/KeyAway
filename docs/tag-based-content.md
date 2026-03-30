# Tag-based / visitor personalization (KeyAway)

This documents **where** tier- and spam-driven copy lives today and **how** to change it later.

## Data source

- **`visitor`** documents in Sanity (`visitTier`: `new` | `returning` | `regular` | `star`, `isSpammer`, `visitCount`, `lastActivityAt`, …).
- Written on each production **`page_viewed`** in `POST /api/v1/analytics/track` via `upsertVisitorOnPageView` (`src/lib/visitors/upsertVisitorOnPageView.ts`).
- **Read path (public site):** `getVisitorContextForPublicPage(headers)` in `src/lib/visitors/serverVisitorContext.ts` — hashes IP (same salt as events), loads matching `visitor`, returns `visitorWelcomeLine` and `isSpammer`.

## Where copy is injected

| Location | File | Behavior |
|----------|------|----------|
| Homepage hero | `src/app/page.tsx` → `HeroSection` | Passes `visitorWelcomeLine` from `getVisitorContextForPublicPage`. |
| Hero UI | `src/components/home/HeroSection.tsx` | Renders optional line under main subtitle when `visitorWelcomeLine` is set. |
| Program page | `src/app/program/[slug]/page.tsx` | Same helper; passes `visitorWelcomeLine` to `ProgramInformation` and `isSpammer` to `CDKeyTable`. |
| Program hero | `src/components/program/ProgramInformation.tsx` | Optional line under description. |
| Spammer UX | `CDKeyTable` / `CDKeyActions` | `isSpammerVisitor` greys/disables report actions; APIs return `skipped: true`. |

## Editing the messages

- **Code-only today:** lines are hardcoded in `welcomeLineForTier()` inside `src/lib/visitors/serverVisitorContext.ts` (tiers `returning`, `regular`, `star`; `new` and spammers get no promo line).
- **To add CMS-driven promos later:** add Sanity types (e.g. `personalizationSnippet` keyed by tier) and have `getVisitorContextForPublicPage` fetch by `visitTier` / flags instead of the local `switch`.

## Admin / analytics

- **Visitor tiers & spam** show on event rows (GROQ join on `ipHash` in `trackingEventsWithRangeQuery`).
- **Dashboard:** “Visitor tags (by last activity in range)” table uses `fetchVisitorTagAggregatesForRange` (`src/lib/analytics/eventsApi.ts`) — counts tiers + **Spammers (flagged)** in one table.
