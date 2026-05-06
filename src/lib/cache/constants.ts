/**
 * Public route ISR / Data Cache fallback (seconds). Webhooks should bust tags before this window matters.
 *
 * `export const revalidate` in `app/layout`, pages, and `sitemap.ts` must use the same numeric literal (Next.js
 * does not accept imported values for segment config — see those files).
 */
export const PUBLIC_ISR_REVALIDATE_SECONDS = 120;
