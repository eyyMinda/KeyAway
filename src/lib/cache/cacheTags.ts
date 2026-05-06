/** Next.js `fetch` / `unstable_cache` tag names — keep in sync with webhook + admin revalidation. */

export const TAG_STORE_DETAILS = "storeDetails";

/** Full program docs for notifications heuristics (keys, dates). */
export const TAG_PROGRAMS_FULL = "programs";

/** Card/list projections: homepage popular strip, /programs grid, program page sidebar list. */
export const TAG_PROGRAM_LISTINGS = "program-listings";

/** Homepage popular programs query (not site-wide stats). */
export const TAG_HOMEPAGE_PROGRAMS = "homepage-programs";

/** Homepage stats block (counts). */
export const TAG_HOMEPAGE_STATS = "homepage-stats";

/** Sitemap.xml + `generateStaticParams` slug list — bust only when URL set changes. */
export const TAG_SITEMAP_URLS = "sitemap-urls";

export const TAG_NOTIFICATIONS = "notifications";

export const TAG_FEATURED_PROGRAM = "featured-program";

export const TAG_BUNDLE_COUNTS = "bundle-counts";

export function programDetailTag(slug: string): string {
  return `program-${slug}`;
}
