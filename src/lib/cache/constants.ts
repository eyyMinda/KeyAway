/**
 * Public route ISR / Data Cache fallback (seconds). Webhooks should bust tags before this window matters.
 *
 * `export const revalidate` in `app/layout`, pages, and `sitemap.ts` must be the same numeric literal (e.g.
 * `43200`) — Next.js rejects imported values for segment config. Keep in sync when changing this constant.
 * Currently set to 12 hours.
 */
export const PUBLIC_ISR_REVALIDATE_SECONDS = 43200;
