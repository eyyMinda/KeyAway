# KeyAway

**A centralized place to get free CD keys** for PC optimization and utility software. KeyAway is a full-stack web app that lets visitors browse and copy giveaway keys in one place, while admins manage programs and keys via a headless CMS and a protected dashboard with analytics and key health monitoring.

---

## For visitors

- **One place for giveaway keys** — Browse programs, see which keys are working or expiring, copy keys and follow activation instructions.
- **Always up to date** — Keys are managed in a CMS; expired keys are automatically marked and can be updated in bulk.
- **Privacy-aware** — Analytics uses hashed identifiers; no personal data is stored.

---

## Under the hood

KeyAway is a **production-style side project** that demonstrates:

- **Full-stack Next.js (16)** — App Router, server/client components, API routes, middleware-style proxy, and incremental adoption of React 19.
- **Content & auth** — **Sanity v5** as headless CMS with embedded Studio; **Auth.js (NextAuth v5)** with GitHub (and optional Google) OAuth for admin; JWT sessions and org/allowlist-based access control.
- **API design** — Versioned REST-style API (`/api/v1/...`): analytics tracking, key reports, key suggestions, contact, cron jobs (expired-key updates, event bundling), webhooks for revalidation, and protected admin endpoints.
- **Data & DX** — TypeScript end-to-end; server actions and shared Sanity client; rate limiting, IP hashing for analytics, and structured error handling.
- **SEO & performance** — Dynamic metadata and JSON-LD, server-rendered program pages, and optional Vercel Analytics / Speed Insights.

No database beyond Sanity (document store); no separate backend service. Suited to reading as a single full-stack codebase.

---

## Tech stack

| Area      | Choices                                                                        |
| --------- | ------------------------------------------------------------------------------ |
| Framework | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/) |
| CMS       | [Sanity v5](https://www.sanity.io/) (Studio embedded at `/studio`)             |
| Auth      | [Auth.js (NextAuth v5)](https://authjs.dev/) — GitHub (Google optional)        |
| Language  | [TypeScript](https://www.typescriptlang.org/)                                  |
| Styling   | [Tailwind CSS](https://tailwindcss.com/) v4                                    |
| Comments  | [Giscus](https://giscus.app/) (GitHub-based)                                   |
| Hosting   | [Vercel](https://vercel.com/) (Analytics, Speed Insights, Cron)                |

---

## Project structure (high level)

```
src/
  app/
    page.tsx, layout.tsx          # Home, global layout
    program/[slug]/               # Program pages (CD keys, instructions, related)
    programs/                     # Programs listing
    privacy/, terms/              # Legal pages
    studio/[[...tool]]/           # Embedded Sanity Studio
    admin/                        # Dashboard (auth required)
      analytics, events, programs, key-reports, key-suggestions, messages
    api/v1/                       # API
      analytics/track, key-reports, key-suggestions, contact
      cron/update-expired-keys, cron/bundle-events, cron/prune-cron-runs
      webhooks/revalidate
      admin/*                     # Protected admin APIs
  components/                     # UI (layout, program, admin, home)
  lib/                            # Sanity client, queries, actions, utils, auth
  sanity/                         # Sanity schemas and config
  types/                          # Shared TypeScript types
```

---

## Features (summary)

- **Public:** Home (featured + popular programs), program pages with CD key table and status, activation instructions, related programs, Giscus comments, privacy/terms.
- **Admin (OAuth):** Analytics dashboard, events, program management, key reports (with notifications and `?key=` filtering), key suggestions, messages, featured program settings. Sign-out and Studio link in site nav.
- **Automation:** Expired keys updated on program load (rate-limited) and via cron; event bundling cron; `cronRun` retention prune cron; webhook revalidation on Sanity changes (rebuilds the header notification feed when programs/keys change).
- **Security & privacy:** Auth.js sessions; admin allowlist or Sanity Access; hashed IPs for analytics; rate limiting on APIs.

---

## Implementations in detail

Short notes on what each part does and why.

- **Event bundling (cron)** — Raw tracking events (copy, download, social, etc.) are rolled up into `trackingEventBundle` documents. Reduces document count and keeps within Sanity quota instead of one row per click.
- **Expired-key updates** — Keys past `validUntil` are marked expired in Sanity. Triggered by a cron job (all programs) and on program page load via middleware (rate-limited to once per 5 minutes per program) so the CMS stays in sync without hammering the API.
- **Key reports** — Visitors submit “working” / “expired” / “limit reached” for a key. Stored as `keyReport` with hashed key and hashed IP; same visitor can update an existing report (e.g. key stopped working). Feeds admin key-reports and notifications.
- **Key-report notifications** — API aggregates negative reports over the last 60 days, excludes keys already marked expired/limit in the CMS, and returns `lastReportAt`. Admin header shows alerts with links to filtered key-reports (`?program=` and `?key=`).
- **Analytics tracking** — Copy, download, and social events sent to `/api/v1/analytics/track`. IP is hashed with `ANALYTICS_SALT`; no PII stored. Data is used for popularity and dashboard stats.
- **Cache & revalidation** — Public pages use a short **segment revalidate** window (shared constant, currently 120s) plus **tagged** Sanity fetches so `revalidateTag` can invalidate data before ISR would. The Sanity webhook (`POST /api/v1/webhooks/revalidate`, `SANITY_WEBHOOK_SECRET`) and admin program saves bust tags by document type — e.g. `storeDetails`, `program` / `cdKey` (and sitemap when the URL set changes), `featuredProgramSettings`, `keyReport`.
- **Header notifications (program activity)** — One **`siteNotificationFeed`** document stores a capped list of “what’s new” rows, rebuilt when programs or CD keys change (webhook or admin program APIs). **One row per program**, roughly the last 30 days by `_updatedAt` with real listing or key activity in that window. The header uses **`GET /api/v1/notifications/recent`**, cached server-side and cleared when the feed is rewritten.
- **Admin auth** — Auth.js (NextAuth v5) with GitHub (and optional Google). Access to `/admin` is restricted by email allowlist (`ADMIN_ALLOWED_EMAILS`) or Sanity project membership; JWT session (e.g. 2h prod, 7d dev).
- **Featured program** — One program is pinned as “featured” in Sanity and highlighted on the home page. Auto-rotation cycles through eligible programs over time so each gets exposure and visitors discover new options.

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/eyyMinda/KeyAway.git
cd KeyAway
npm install
```

### 2. Environment variables

Create `.env.local` in the project root. Required for a working setup:

```bash
# Sanity
NEXT_PUBLIC_SANITY_STUDIO_PROJECT_ID=yourProjectId
NEXT_PUBLIC_SANITY_STUDIO_DATASET=production
SANITY_API_TOKEN=yourSanityApiToken          # Writes: key reports, analytics, CRUD
SANITY_WEBHOOK_SECRET=yourWebhookSecret     # Webhook revalidation

# Auth (admin)
AUTH_SECRET=yourAuthSecret                   # e.g. openssl rand -base64 32
AUTH_GITHUB_ID=yourGitHubClientId
AUTH_GITHUB_SECRET=yourGitHubClientSecret
ADMIN_ALLOWED_EMAILS=you@example.com        # Or use Sanity Access (SANITY_ACCESS_TOKEN)

# Optional
CRON_SECRET=yourCronSecret                   # Cron routes (e.g. update-expired-keys)
ANALYTICS_SALT=yourRandomSalt                # IP hashing for analytics
```

**Google login (optional):** Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`, then in `auth.ts` uncomment the Google provider import and the `Google({ ... })` block in the `providers` array.

### 3. Run

```bash
npm run dev
```

- **Site:** http://localhost:3000
- **Sanity Studio:** http://localhost:3000/studio
- **Admin:** http://localhost:3000/admin (GitHub sign-in)

### 4. Content

In Studio, create **Program** documents and add CD keys (key, status, version, valid from/until). Program pages and home will reflect changes; expired keys can be updated automatically or via cron.

---

## Scripts

| Command         | Description      |
| --------------- | ---------------- |
| `npm run dev`   | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production |
| `npm run lint`  | Run ESLint       |

---

## Deployment (Vercel)

- Set all required env vars in the Vercel project.
- Build command: `npm run build`; output: default Next.js.
- Optional: Vercel Cron for `/api/v1/cron/update-expired-keys`, `/api/v1/cron/bundle-events`, and `/api/v1/cron/prune-cron-runs` (use `CRON_SECRET` or Vercel’s cron headers).
- **Webhook:** Point Sanity revalidate webhook to `https://yourdomain.com/api/v1/webhooks/revalidate` and set `SANITY_WEBHOOK_SECRET`.

---

## Legal

- [Terms of Service](docs/TERMS_OF_SERVICE.md)
- [Privacy Policy](docs/PRIVACY_POLICY.md)

---

## License

MIT. See [LICENSE](LICENSE) for details. KeyAway (keyaway.app) retains all rights to the KeyAway name and branding.
