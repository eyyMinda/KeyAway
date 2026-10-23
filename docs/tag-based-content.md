# Visitor-tier content

Where tier- and contribution-based copy appears on the public site and how to change it. For how tiers are computed, see [visitor-tags.md](visitor-tags.md).

## Data source

- `getVisitorContextForPublicPage(headers)` (`src/lib/visitors/serverVisitorContext.ts`) hashes the request IP, loads the visitor from `analytics.visitors` and returns `visitorHint` (tier and contribution summary) and `isSpammer`.
- The hint copy is built in `buildVisitorHintData` (`src/lib/visitors/buildVisitorHintData.ts`) from the tier and contribution type (`contributionTypeFromCounts` in `visitTier.ts`).

## Where copy appears

| Location | File | Behaviour |
| --- | --- | --- |
| Homepage hero | `src/app/page.tsx` → `src/components/home/HeroSection.tsx` | Shows `VisitorTierHint` (button + popover) when `visitorHint` is set |
| Program page hero | `src/app/program/[slug]/page.tsx` → `src/components/program/ProgramInformation.tsx` | Same hint |
| Key actions | `CDKeyTable` / `CDKeyActions` | `isSpammerVisitor` disables report actions; the APIs skip storing them |

## Changing the messages

Copy lives in code, in `buildVisitorHintData`. To make it editable in Studio, add a Sanity type (for example snippets keyed by tier and contribution type) and have `buildVisitorHintData` read from it.
