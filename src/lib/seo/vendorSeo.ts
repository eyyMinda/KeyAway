import type { StoreDetailsForSeo } from "@/src/lib/seo/storeSeoResolve";
import { buildStoreSeoVariableMap, resolveDefaultOgImageUrl, resolveSiteBaseUrl } from "@/src/lib/seo/storeSeoResolve";

export interface VendorSeoInput {
  name: string;
  slug: string;
  programCount?: number;
  seo?: { metaTitle?: string; metaDescription?: string };
}

/** SEO for the /vendors index page. */
export function resolveVendorsIndexSeo(store: StoreDetailsForSeo | null | undefined) {
  const s = store ?? {};
  const vars = buildStoreSeoVariableMap(s);
  const siteUrl = resolveSiteBaseUrl(s.seo);
  return {
    title: `Software Vendors & Publishers | ${vars.title}`,
    description: `Browse software publishers on ${vars.title} — free promotional CD keys, giveaways, and PRO upgrade deals grouped by vendor.`,
    pageUrl: `${siteUrl}/vendors`,
    ogImageUrl: resolveDefaultOgImageUrl(s.seo),
    storeTitle: vars.title,
    siteUrl
  };
}

/** SEO for a /vendors/{slug} hub page (vendor overrides win, else derived defaults). */
export function resolveVendorHubSeo(store: StoreDetailsForSeo | null | undefined, vendor: VendorSeoInput) {
  const s = store ?? {};
  const vars = buildStoreSeoVariableMap(s);
  const siteUrl = resolveSiteBaseUrl(s.seo);
  const count = vendor.programCount ?? 0;
  const countLabel = count > 0 ? `${count} program${count === 1 ? "" : "s"}` : "programs";

  const title = vendor.seo?.metaTitle?.trim() || `${vendor.name} CD Keys & Giveaways | ${vars.title}`;
  const description =
    vendor.seo?.metaDescription?.trim() ||
    `Free ${vendor.name} promotional CD keys and giveaways on ${vars.title}. Browse ${countLabel}, verified community reports, and official PRO upgrade deals.`;

  return {
    title,
    description,
    pageUrl: `${siteUrl}/vendors/${vendor.slug}`,
    ogImageUrl: resolveDefaultOgImageUrl(s.seo),
    storeTitle: vars.title,
    siteUrl
  };
}
