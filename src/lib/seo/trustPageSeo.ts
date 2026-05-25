import type { StoreDetailsForSeo } from "@/src/lib/seo/storeSeoResolve";
import { buildStoreSeoVariableMap, resolveSiteBaseUrl } from "@/src/lib/seo/storeSeoResolve";

function resolveTrustPageSeo(
  store: StoreDetailsForSeo | null | undefined,
  path: string,
  titleFallback: string,
  descriptionFallback: string
) {
  const s = store ?? {};
  const vars = buildStoreSeoVariableMap(s);
  const siteUrl = resolveSiteBaseUrl(s.seo);
  const pageUrl = `${siteUrl}${path}`;
  const title = titleFallback.replace("[title]", vars.title);
  const description = descriptionFallback.replace("[title]", vars.title);
  return { title, description, pageUrl, storeTitle: vars.title };
}

export function resolveHowItWorksPageSeo(store: StoreDetailsForSeo | null | undefined) {
  return resolveTrustPageSeo(
    store,
    "/how-it-works",
    "How It Works | [title]",
    "Learn how [title] lists official promotional CD keys, how community reports work, and what we never host."
  );
}

export function resolveAboutPageSeo(store: StoreDetailsForSeo | null | undefined) {
  return resolveTrustPageSeo(
    store,
    "/about",
    "About | [title]",
    "What [title] is, how we help you find legal software giveaway keys, and how to reach us."
  );
}

export function resolveAffiliateDisclosurePageSeo(store: StoreDetailsForSeo | null | undefined) {
  return resolveTrustPageSeo(
    store,
    "/affiliate-disclosure",
    "Affiliate Disclosure | [title]",
    "How [title] uses affiliate links, outbound vendor links, and how that supports free giveaway listings."
  );
}

export function resolveVerificationPolicyPageSeo(store: StoreDetailsForSeo | null | undefined) {
  return resolveTrustPageSeo(
    store,
    "/verification-policy",
    "Verification Policy | [title]",
    "How [title] handles community key reports, listings review, and giveaway accuracy."
  );
}

export function resolveDmcaPageSeo(store: StoreDetailsForSeo | null | undefined) {
  return resolveTrustPageSeo(
    store,
    "/dmca",
    "Report Content | [title]",
    "How to report copyright or content issues on [title]."
  );
}

export function resolvePartnersPageSeo(store: StoreDetailsForSeo | null | undefined) {
  return resolveTrustPageSeo(
    store,
    "/partners",
    "Partners & Vendors | [title]",
    "Work with [title] on official software giveaways and promotional listings."
  );
}
