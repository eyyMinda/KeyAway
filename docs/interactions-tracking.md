# Interactions tracking naming rules

This project uses a dedicated bucketed interaction pipeline (`interactionEventBucket`), separate from analytics events.

## Required fields

- `interactionId` — exact element/action identity
- `sectionId` — coarse placement identity (top-level section)
- `pagePath` — normalized route path
- `programSlug` — optional, only when interaction is program-specific

## `sectionId` rules

Author sections with the nested map `SECTIONS` in `src/lib/analytics/interactionCatalog.ts` (e.g. `SECTIONS.home.hero`). Allowed **stored string values** are exactly:

| Group | Constant | Stored value |
| --- | --- | --- |
| `global` | `header` | `header` |
| `home` | `hero` | `hero` |
| `home` | `featuredProgram` | `featured_program` |
| `home` | `popularPrograms` | `popular_programs` |
| `home` | `features` | `features` |
| `home` | `cta` | `cta` |
| `browse` | `allProgramsGrid` | `all_programs_grid` — full grid on `/programs` |
| `program` | `programInformation` | `program_information` — `ProgramInformation.tsx` on `/program/[slug]` |

`sectionId` should be stable and broad. Do not encode button-level details here.

Merged flat access: `SECTION_IDS` (same values as `SECTIONS.*.*`) for defaults and tooling.

## `interactionId` rules

Use only values from `INTERACTION_IDS` in `src/lib/analytics/interactionCatalog.ts`.

Conventions:

- lower_snake_case
- verb/action last when practical (`..._open`, `..._click`, `..._view_keys`)
- stable over time (do not include transient UI copy or locale text)

Examples:

- `hero_visitor_hint_open`
- `program_grid_view_keys_button`
- `featured_program_view_keys`
- `header_contact`

## Adding new interactions

1. Add section constant(s) under the right `SECTIONS.*` group (or add a new group if needed), then rely on the flattened `SECTION_IDS` for allowlisting.
2. Add interaction constant(s) to `INTERACTION_IDS`.
3. Use constants in component tracking calls (`trackInteraction`).
4. Keep `sectionId` top-level and move element-specific meaning into `interactionId`.
5. Avoid creating dynamic IDs from user/content strings unless absolutely needed.
