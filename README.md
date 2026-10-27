# KeyAway

**Free, working license keys for PC software, in one place.** [keyaway.app](https://keyaway.app) collects giveaway CD keys and PRO accounts for Windows and Mac programs (IObit, iTop, SoftOrbits, AOMEI and more), shows which ones still work, and keeps them up to date.

It is also a one-person, production full-stack project: a public Next.js site, a content studio, an admin dashboard and a set of background jobs that find new giveaways, track program versions and keep keys honest.

---

## For visitors

- **Find a key fast.** Every program has its own page with its keys, their status (new, working, expired, limit reached), the program version they work with, and step-by-step activation instructions.
- **See what actually works.** Visitors report whether a key worked; reports flag dead keys for review, and keys past their end date expire automatically.
- **Know what you're getting.** Program pages explain what the software does, compare the free edition with the paid PRO one, and answer common questions. Vendor pages (e.g. `/vendors/iobit`) group a publisher's programs and explain how a giveaway key differs from a paid license.
- **Stay current.** The bell in the header lists programs with new keys, `/updates` shows recent key activity and `/changelog` lists site releases.
- **Talk to us.** Comment on a program, suggest a key you found, or use the contact form.
- **Privacy.** No accounts. Analytics use a salted hash of your IP, never the IP itself. Ads load only with your consent where the law requires it (EEA, UK, Switzerland) and the footer has "Your privacy choices". See the [Privacy Policy](docs/PRIVACY_POLICY.md).

---

## Highlights (for the technically curious)

- **Next.js 16 + React 19, App Router**, deployed on Vercel. Public pages are statically cached and invalidated by cache tags when content changes, so the site stays fast without going stale.
- **Sanity v5** as the CMS (Studio embedded at `/studio`) for content, **Supabase Postgres** for high-volume analytics (sessions, events, visitors, key reports).
- **A custom admin dashboard** (`/admin`, GitHub sign-in) with analytics, key-report triage, comment moderation, messages with email replies, and a full program and vendor editor.
- **Background automation** on Vercel Cron: a giveaway-site scanner that matches posts to existing programs, a daily version checker that reads the version straight from vendor installers, key expiry, and stats rollups.
- **Content tooling:** prefill a new program from the vendor's pages and official press kit, either in the admin or from a Claude Code command, then review and save.
- **Care for the details:** optimistic-concurrency saves, rich text kept lossless through a Markdown round-trip, polite crawling (robots.txt, per-host limits, byte caps), IndexNow pings, JSON-LD, consent-gated ads with a strict Content Security Policy.

---

## Tech stack

| Area      | Choices                                                                                   |
| --------- | ----------------------------------------------------------------------------------------- |
| Framework | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), TypeScript |
| Content   | [Sanity v5](https://www.sanity.io/), Studio embedded at `/studio`                        |
| Database  | [Supabase](https://supabase.com/) Postgres (analytics schema) via [`postgres`](https://github.com/porsager/postgres) |
| Auth      | [Auth.js (NextAuth v5)](https://authjs.dev/), GitHub (Google optional), email allowlist   |
| Styling   | [Tailwind CSS v4](https://tailwindcss.com/), admin light/dark theme                       |
| Email     | [Resend](https://resend.com/) (replies to contact messages)                              |
| Scraping  | [cheerio](https://cheerio.js.org/) (giveaway scanner, prefill, version checks)            |
| Hosting   | [Vercel](https://vercel.com/) (Cron, Speed Insights)                                      |

---

## How it works

A quick tour of the main systems: what each does, roughly how, and where it lives.

### Public site

Home, `/programs` (search, filters, pagination), program pages `/program/[slug]`, vendor hubs `/vendors/[slug]`, `/updates`, `/changelog` and the info/legal pages. Content comes from Sanity through tagged, cached fetches (`src/lib/sanity/queries.ts`, `src/lib/cache/`). Program page sections live in `src/components/program/`.

### Keys: status, expiry, reports and suggestions

- Each program has a list of **activation entries**: CD keys, PRO accounts or giveaway links, depending on its activation flow.
- **Expiry:** keys past their `validUntil` date show as expired the moment the date passes (worked out when the page renders) and are saved as expired in Sanity by a nightly job. New keys move from "new" to "active" after 30 days. See [docs/EXPIRED_KEYS_SYSTEM.md](docs/EXPIRED_KEYS_SYSTEM.md).
- **Reports:** visitors mark a key as working, expired or limit reached (`/api/v1/key-reports`). Negative reports raise header notifications in the admin, linked to the key-reports page filtered to that key.
- **Suggestions:** visitors can submit keys they found (`/api/v1/key-suggestions`), reviewed under Admin → Key suggestions.

### Admin dashboard (`/admin`)

GitHub sign-in limited to `ADMIN_ALLOWED_EMAILS` (or Sanity project members). Pages: dashboard, analytics, sessions, **programs** (tabs: Programs, Vendors, Versions), key reports, key suggestions, giveaway finds, comments, messages. All admin APIs live under `/api/v1/admin/*` and check the session server-side.

### Program and vendor editor

`/admin/programs` lists every program in a filterable table (vendor, category, activation flow, key health, missing content), with a "show more" list and quick views of each program's working keys. Clicking a row opens a slide-over editor with tabs for basics, content (description, about sections, FAQ, free vs PRO), keys, media and SEO.

- Rich text is edited as Markdown and converted back to Sanity Portable Text without losing formatting. Untouched fields are saved byte-for-byte as they were.
- Saves send only the changed fields and are rejected if the document changed elsewhere since it was opened (Studio, a cron job, another tab).
- Vendors get the same treatment in the Vendors tab: logo with background color, hub description, aliases, giveaway-vs-PRO comparison and SEO.

Details: [docs/program-management.md](docs/program-management.md). Code: `src/components/admin/programs/`, `src/components/admin/vendors/`, `src/lib/admin/`.

### Program prefill

Creating a program page by hand takes a while, so the editor's **Prefill** button gathers the facts first:

1. **Scrape** the vendor's product page: structured data, feature sections, download links, images and FAQs. For IObit it also pulls the product's section of IObit's FAQ page.
2. **Read the official press kit** when the vendor publishes one. IObit's press room is found automatically; any vendor's kit can be given as a `.zip` URL. The kit supplies the version, release date, what's new, FAQ, press release and screenshots.
3. **Read the installer** for the exact version (see version checks below).
4. Apply the data **as-is**, or copy a ready-made **AI prompt** into Claude/ChatGPT and paste the JSON answer back. The prompt carries KeyAway's writing rules: no hype, no duplicated claims, only sourced facts.
5. Pick which groups to apply. Nothing is saved until you review the form.

The same pipeline runs from **Claude Code** with `/prefill-program <url>` and `/prefill-vendor <url>` (project commands in `.claude/skills/`), backed by `npm run prefill:scrape` and `npm run prefill:check`. Code: `src/lib/prefill/`.

### Version checks

A daily job (`/api/v1/cron/check-versions`) looks up each program's newest official version. Sources, best first:

- **Vendor installer.** Downloads only the first megabyte of the vendor's own `.exe` and reads the version stored inside it, plus the file's date as the release date. It is same-day and first-party, and flags small web-installer stubs whose version isn't the program's.
- **Vendor page.** Finds "Version 1.2.3"-style text or a custom pattern.
- **FilePuma.** A software library that lists the latest version of most Windows programs; searched by the program's exact name.
- **winget, Chocolatey, Homebrew.** Package catalogs, as a fallback.

Versions are compared as major.minor. Results show in Admin → Programs → **Versions** with one-click "Update to X" (or auto-apply per program), and as a badge in the programs list. The job only writes when a result changes. Code: `src/lib/versions/`.

### Giveaway finder

A daily job (`/api/v1/cron/discover-giveaways`) scans configured giveaway sites (RSS feeds, WordPress REST APIs and individually watched pages) for posts about programs KeyAway already lists.

- **Matching:** posts are matched by program title, aliases and vendor names. Edition words, versions and vendor prefixes are ignored when matching.
- **Extraction:** only matching posts are opened, and keys, accounts and claim links are pulled out of them.
- **Dedupe:** results are compared against what the program already has and an ignore list.
- **Crawling:** it respects robots.txt, limits each host and caps page size.

New finds appear in Admin → Giveaway finds. From there one click adds an entry to the program, matching its activation flow. Sources are configured in Studio (Giveaway Discovery settings). Code: `src/lib/giveaways/`.

### Analytics

- **Events:** page views, key copies, download clicks and shares go to `/api/v1/analytics/track`. Visits are grouped into sessions and visitors, keyed by a salted IP hash, and stored in Supabase (`supabase/migrations/`, `src/lib/db/`).
- **Stats rollup:** every 6 hours `sync-program-stats` rolls sessions up into per-program view and download counts. Those counts drive popularity sorting and the featured-program rotation.
- **Admin pages:** the analytics and sessions pages read the same data. Spammers can be marked and excluded.

### Ads and consent

Third-party ad units live in `src/components/ads` (keys and the on/off switch in `src/lib/ads/adConfig.ts`).

- **Placement:** iframe banners run in their own sandboxed `srcdoc` frame, a native banner renders once per page, and program grids insert ad cards every N items.
- **Loading rules:** units load only near the viewport and only with ad consent (`src/lib/consent/adConsent.ts`). Consent is opt-in for the EEA, UK and Switzerland (detected by `/api/v1/consent-region`) and opt-out elsewhere, Global Privacy Control is honoured, and the footer's "Your privacy choices" reopens the choice.
- **Never loaded** in the admin or Studio.
- **New ad domains** must be added to `AD_ORIGINS` in `next.config.ts` (Content Security Policy).

### Caching, notifications and SEO

- **Caching:** public pages are cached for 12 hours and invalidated earlier by tag. Admin saves and a Sanity webhook (`/api/v1/webhooks/revalidate`) bust the affected tags.
- **Notifications:** a single `siteNotificationFeed` document powers the header's "what's new" list. It is rebuilt whenever programs or keys change.
- **SEO:** metadata and JSON-LD per page, a dynamic sitemap, and IndexNow pings after program changes (`src/lib/seo/`).

### Changelog

Merged pull requests become `/changelog` entries. A GitHub Action (`.github/workflows/changelog-sync.yml`) runs `scripts/syncChangelogPrToSanity.mjs`, which turns the PR description into a release document in Sanity.

---

## Scheduled jobs

| Job                   | When (UTC)    | What it does                                                    |
| --------------------- | ------------- | --------------------------------------------------------------- |
| `sync-program-stats`  | every 6 hours | Rolls analytics sessions into program views/downloads/popularity |
| `check-versions`      | 06:00 daily   | Looks up the latest official version of tracked programs        |
| `discover-giveaways`  | 07:00 daily   | Scans giveaway sites for new keys for existing programs         |
| `update-expired-keys` | 22:00 daily   | Marks keys past their end date as expired                       |
| `prune-cron-runs`     | 03:15 daily   | Deletes cron run logs older than 7 days                         |

Schedules are in `vercel.json`; routes are under `/api/v1/cron/*` and accept Vercel's cron header or `Authorization: Bearer $CRON_SECRET`. Each can also be triggered manually by an admin. Runs are logged and shown on the admin dashboard.

---

## Project structure

```
src/
  app/
    page.tsx, programs/, program/[slug]/, vendors/   # Public site
    updates/, changelog/, about/, how-it-works/ …     # Info and legal pages
    studio/[[...tool]]/                              # Embedded Sanity Studio
    admin/                                           # Dashboard (auth required)
    api/v1/                                          # REST-style API: public, admin/*, cron/*, webhooks/
  components/                                        # UI: home, program, admin, ads, layout, …
  lib/
    admin/        # Program/vendor field rules and saves
    prefill/      # Page scraper, press kits, prefill format and AI prompt
    versions/     # Version sources, installer reader, daily check
    giveaways/    # Giveaway scanner: sources, matching, extraction, dedupe
    analytics/, db/, visitors/                       # Tracking and Supabase access
    sanity/, cache/, seo/, consent/, ads/, …
  sanity/         # Studio schemas, structure and custom inputs
scripts/          # One-off and maintenance scripts (backfills, changelog sync, prefill)
supabase/         # SQL migrations for the analytics schema
.claude/skills/   # Claude Code prefill commands
docs/             # Deeper notes and legal pages
```

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/eyyMinda/KeyAway.git
cd KeyAway
npm install
```

### 2. Environment variables

Create `.env.local` in the project root:

```bash
# Sanity
NEXT_PUBLIC_SANITY_STUDIO_PROJECT_ID=yourProjectId
NEXT_PUBLIC_SANITY_STUDIO_DATASET=production
SANITY_API_TOKEN=yourSanityApiToken           # Server reads and writes
SANITY_WEBHOOK_SECRET=yourWebhookSecret       # Revalidation webhook

# Supabase (analytics)
SUPABASE_DB_URL=postgres://...                # Pooler connection string; URL-encode the password

# Auth (admin)
AUTH_SECRET=yourAuthSecret                    # e.g. openssl rand -base64 32
AUTH_GITHUB_ID=yourGitHubClientId
AUTH_GITHUB_SECRET=yourGitHubClientSecret
ADMIN_ALLOWED_EMAILS=you@example.com          # Or use Sanity Access (SANITY_ACCESS_TOKEN)

# Optional
NEXT_PUBLIC_SITE_URL=https://keyaway.app      # Canonical URLs, sitemap, IndexNow
CRON_SECRET=yourCronSecret                    # Bearer auth for /api/v1/cron/*
ANALYTICS_SALT=yourRandomSalt                 # IP hashing
GITHUB_TOKEN=ghp_...                          # Raises the GitHub rate limit for winget version checks
NEXT_PUBLIC_ADS_ENABLED=false                 # Ads: on in production, off in dev by default
NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED=true     # Vercel Web Analytics (off when unset)
NEXT_PUBLIC_SPEED_INSIGHTS_SAMPLE_RATE=0.15

# Email replies to contact messages (Resend)
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM="KeyAway <support@keyaway.app>"   # Must use a verified domain
RESEND_REPLY_TO=support@keyaway.app
```

Run `supabase/migrations/*.sql` once in the Supabase SQL editor to create the analytics schema.

**Google login (optional):** set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`, then uncomment the Google provider in `auth.ts`.

### 3. Run

```bash
npm run dev
```

- **Site:** http://localhost:3000
- **Studio:** http://localhost:3000/studio
- **Admin:** http://localhost:3000/admin

---

## Scripts

| Command                         | Description                                                       |
| ------------------------------- | ----------------------------------------------------------------- |
| `npm run dev` / `build` / `start` | Develop, build, serve                                           |
| `npm run lint`                  | ESLint                                                            |
| `npm run prefill:scrape -- <url>` | Scrape a product page, press kit and installer for prefill      |
| `npm run prefill:check -- <file>` | Validate a prefill JSON before pasting it into the admin        |
| `npm run sync:changelog-pr -- <n>` | Publish a merged PR as a changelog release                      |
| `npm run backfill:vendors`      | One-time: create vendor documents and link programs (dry run without `--write`) |
| `npm run backfill:changelog`    | One-time: import merged PRs as changelog releases (dry run without `--write`) |

---

## Deployment (Vercel)

- Set the environment variables in the Vercel project; the cron jobs in `vercel.json` are picked up automatically.
- Point a Sanity webhook at `https://yourdomain.com/api/v1/webhooks/revalidate` with `SANITY_WEBHOOK_SECRET`.

---

## Docs

- [Program management](docs/program-management.md): editor, vendors, version checks, prefill
- [Key status updates](docs/EXPIRED_KEYS_SYSTEM.md): expiry and new → active
- [Visitors, tiers and spammers](docs/visitor-tags.md) and [visitor-tier content](docs/tag-based-content.md)
- [Terms of Service](docs/TERMS_OF_SERVICE.md) · [Privacy Policy](docs/PRIVACY_POLICY.md)

---

## License

MIT. See [LICENSE](LICENSE). KeyAway (keyaway.app) retains all rights to the KeyAway name and branding.
