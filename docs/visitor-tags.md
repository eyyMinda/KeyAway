# Visitor tags and `visitor` documents

This document describes how **visitor identity**, **session counts**, **tiers** (“tags”), and **spammer** state work in production code. Paths are from the repo root.

## Identity: who is one visitor?

- A **visitor** is keyed by `**visitorHash`**, a **SHA-256 hash of the client IP + `ANALYTICS_SALT`** (see `src/lib/api/requestGeo.ts`).
- The same value is stored on each tracking row as `**ipHash**` (`trackingEvent` / bundled events). Admin queries join `visitor` with `visitorHash == ipHash` (`src/lib/sanity/queries.ts`).
- **Not** a browser cookie or logged-in user: same network path can share one hash; VPN / mobile IP changes can split or merge “visitors.”

## When is a `visitor` document created or updated?

### Normal path: `page_viewed` after track API

1. Client sends `POST /api/v1/analytics/track` with `event: "page_viewed"` (`src/app/api/v1/analytics/track/route.ts`).
2. Server creates a `**trackingEvent`** (or skips on localhost).
3. **After** a successful create, the server calls `**upsertVisitorOnPageView(ipHash)`** (`src/lib/visitors/upsertVisitorOnPageView.ts`).

So: **only `page_viewed` drives visitor upsert**, not `copy_cdkey`, `download_click`, `social_click`, or key reports.

### Session rule (what increments `visitCount`)

- `**visitCount`** is a **session counter**, not a raw page-view counter.
- `**SESSION_GAP_MS = 1 hour`** (`60 * 60 * 1000`).
- On each `page_viewed` upsert:
  - **No existing doc:** create with `visitCount: 1`, `lastActivityAt: now`, `visitTier` from `visitTierFromSessionCount(1)` → `**new`**, `isSpammer: false`.
  - **Existing doc:** compute `newSession = (now - lastActivityAt) > 1h` (or invalid `lastActivityAt` → treat as new session).
    - If **new session:** `visitCount = previous + 1`.
    - If **same session** (≤1h since last activity): `**visitCount` unchanged**.
  - Always update `**lastActivityAt`** and `**visitTier**` from the (possibly updated) `visitCount`, and `**updatedAt**`.

So: many page views within an hour **do not** increase `visitCount`; the first view after 60+ minutes of inactivity does.

## Tier (“visitor tag”) assignment

Tiers are **derived only from `visitCount`** via `visitTierFromSessionCount` (`src/lib/visitors/visitTier.ts`):


| `visitCount` | Tier (`visitTier`) |
| ------------ | ------------------ |
| `1`          | `new`              |
| `2`–`5`      | `returning`        |
| `6`–`15`     | `regular`          |
| `16+`        | `star`             |


Studio option labels in `src/sanity/schemaTypes/visitor.ts` describe the same bands in words (e.g. “Returning (2–5)”). The **source of truth** for behavior is `**visitTierFromSessionCount`** in code.

**Initial tag:** first tracked `page_viewed` → `**new`** (`visitCount === 1`).

## Spammer flag (`isSpammer`)

- **Admin-only** mutation: `PATCH /api/v1/admin/visitor-spammer` (`src/app/api/v1/admin/visitor-spammer/route.ts`).
- If no `visitor` exists and admin sets **spammer = true**, a document can be **created** with `visitCount: 0`, `visitTier: "new"`, `isSpammer: true`, `spamMarkedAt` set (edge case for blocking without a prior page view).
- **Public key reports:** if `isVisitorSpammerByHash(ipHash)` is true, the track route **accepts but skips** creating `keyReport` (`src/lib/visitors/isVisitorSpammerByHash.ts`).
- **Public pages:** `getVisitorContextForPublicPage` returns `isSpammer` and omits `visitorHint` when spammer (`src/lib/visitors/serverVisitorContext.ts`). Program UI uses this to disable reporting (`isSpammerVisitor` on `CDKeyTable`).

Spammer does **not** change tier math in `upsertVisitorOnPageView`; tier still follows `visitCount` when patches run.

## Where tiers show up


| Surface                                  | Behavior                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Homepage hero**                        | Optional **visitor tier hint** (button + popover) when `visitorHint` is built from tier and contributions (`serverVisitorContext.ts` + `VisitorTierHint`).                                                                                                                                         |
| **Admin events / bundles**               | `visitTier` and `visitorIsSpammer` joined in GROQ from `visitor` by `ipHash` (`queries.ts`).                                                                                                                                                                                                      |
| **Admin analytics “Visitor tags” table** | `fetchVisitorTagAggregatesForRange` counts `**visitor` documents whose `lastActivityAt` is in the selected range**, grouped by `visitTier`, plus a row **“Spammers (flagged)”** = count of those rows with `isSpammer === true` (`src/lib/analytics/eventsApi.ts`). Table UI sorts rows by count. |


Important: the **analytics visitor-tags table** is **not** “events in range”; it is **“visitors who had any activity (last touch) in that window,”** with their **current** `visitTier` at query time.

## Sanity fields (`visitor` type)


| Field                     | Role                                                                             |
| ------------------------- | -------------------------------------------------------------------------------- |
| `visitorHash`             | Stable id; matches `trackingEvent.ipHash`.                                       |
| `visitCount`              | Session count (increment rules above).                                           |
| `lastActivityAt`          | Last `page_viewed` upsert time; drives session detection and admin range filter. |
| `visitTier`               | Denormalized tier; recomputed on each upsert from `visitCount`.                  |
| `isSpammer`               | Manual / admin API.                                                              |
| `spamMarkedAt`            | Set when marked spammer; cleared when unmarked.                                  |
| `createdAt` / `updatedAt` | Audit timestamps.                                                                |


## Operational notes

- **Localhost:** track route skips writes; **no** visitor documents from local dev unless you bypass that check.
- **Visitor upsert errors** are logged (`[track] visitor upsert`) but do not fail the HTTP response after the event is stored.
- **Bundling:** bundled events copy `ipHash`; GROQ still resolves `visitTier` / `visitorIsSpammer` from `visitor` the same way.

## Related files

- `src/lib/visitors/upsertVisitorOnPageView.ts` — create/patch and session logic  
- `src/lib/visitors/visitTier.ts` — tier thresholds  
- `src/lib/visitors/serverVisitorContext.ts` — RSC visitor hint + spammer for public pages  
- `src/lib/visitors/isVisitorSpammerByHash.ts` — key-report gate  
- `src/sanity/schemaTypes/visitor.ts` — CMS schema  
- `src/app/api/v1/analytics/track/route.ts` — triggers upsert on `page_viewed`  
- `src/lib/sanity/queries.ts` — `visitTier` / `visitorIsSpammer` on event queries  
- `src/lib/analytics/eventsApi.ts` — `fetchVisitorTagAggregatesForRange`  
- `docs/tag-based-content.md` — product copy tied to tiers on the marketing side

