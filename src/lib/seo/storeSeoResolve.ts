import type { SanityImageSource } from "@sanity/image-url";
import { urlFor } from "@/src/sanity/lib/image";
import type { StoreDetails } from "@/src/types/layout";

export const DEFAULT_STORE_NAME = "KeyAway";
export const DEFAULT_SITE_URL = "https://www.keyaway.app";
export const DEFAULT_OG_IMAGE_URL = "https://www.keyaway.app/images/KeyAway_Card.png";

export type StoreDetailsForSeo = Partial<StoreDetails> & {
  title?: string;
  description?: string;
};

export function buildStoreSeoVariableMap(store: StoreDetailsForSeo): Record<string, string> {
  const title = store.title?.trim() || DEFAULT_STORE_NAME;
  return { title };
}

export function applyStoreSeoTemplate(
  template: string | undefined | null,
  vars: Record<string, string>
): string {
  if (template == null) return "";
  return String(template).replace(/\[([a-zA-Z0-9_]+)\]/g, (_, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key]! : `[${key}]`
  );
}

function trimmedNonEmpty(s: string): string | null {
  const t = s.trim();
  return t.length ? t : null;
}

/** Interpolates placeholders on each keyword; drops empty entries. */
export function resolveMetaKeywordList(
  raw: string[] | undefined | null,
  vars: Record<string, string>
): string[] | undefined {
  if (raw == null || raw.length === 0) return undefined;
  const out = raw
    .map(entry => trimmedNonEmpty(applyStoreSeoTemplate(entry, vars)))
    .filter((k): k is string => k != null);
  return out.length ? out : undefined;
}

export function resolveSiteBaseUrl(seo: StoreDetails["seo"] | undefined): string {
  const raw = seo?.siteUrl?.trim();
  if (!raw) return DEFAULT_SITE_URL;
  try {
    const u = new URL(raw);
    return `${u.protocol}//${u.host}`;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function resolveDefaultOgImageUrl(seo: StoreDetails["seo"] | undefined): string {
  const img = seo?.sharingImage as SanityImageSource | undefined;
  if (!img) return DEFAULT_OG_IMAGE_URL;
  try {
    return urlFor(img).width(1200).height(630).url();
  } catch {
    return DEFAULT_OG_IMAGE_URL;
  }
}

function homeTitleFallback(storeTitle: string): string {
  return `${storeTitle} - Free CD Keys for Premium Software`;
}

function homeDescriptionFallback(store: StoreDetailsForSeo): string {
  return (
    trimmedNonEmpty(store.description ?? "") ??
    "Get free CD keys for popular software like IOBIT, iTop and more. Download premium programs with working activation keys from our giveaway collection."
  );
}

export function resolveHomePageSeo(store: StoreDetailsForSeo | null | undefined) {
  const s = store ?? {};
  const vars = buildStoreSeoVariableMap(s);
  const storeTitle = vars.title;

  const titleFromTemplate = trimmedNonEmpty(applyStoreSeoTemplate(s.seo?.homeMetaTitle, vars));
  const title = titleFromTemplate ?? homeTitleFallback(storeTitle);

  const descFromTemplate = trimmedNonEmpty(applyStoreSeoTemplate(s.seo?.homeMetaDescription, vars));
  const description = descFromTemplate ?? homeDescriptionFallback(s);

  const siteUrl = resolveSiteBaseUrl(s.seo);
  const ogImageUrl = resolveDefaultOgImageUrl(s.seo);
  const keywords = resolveMetaKeywordList(s.seo?.homeMetaKeywords, vars);

  return { title, description, siteUrl, ogImageUrl, storeTitle, keywords };
}

export function resolveProgramsPageSeo(store: StoreDetailsForSeo | null | undefined) {
  const s = store ?? {};
  const vars = buildStoreSeoVariableMap(s);
  const storeTitle = vars.title;

  const titleFromTemplate = trimmedNonEmpty(applyStoreSeoTemplate(s.seo?.programsMetaTitle, vars));
  const title = titleFromTemplate ?? `All Programs - ${storeTitle}`;

  const descFromTemplate = trimmedNonEmpty(applyStoreSeoTemplate(s.seo?.programsMetaDescription, vars));
  const description =
    descFromTemplate ??
    `Browse all software programs with free CD keys on ${storeTitle}. Find premium software for free with verified, working activation keys.`;

  const siteUrl = resolveSiteBaseUrl(s.seo);
  const ogImageUrl = resolveDefaultOgImageUrl(s.seo);
  const pageUrl = `${siteUrl}/programs`;
  const keywords = resolveMetaKeywordList(s.seo?.programsMetaKeywords, vars);

  return { title, description, siteUrl, ogImageUrl, storeTitle, pageUrl, keywords };
}

export function resolvePrivacyPageSeo(store: StoreDetailsForSeo | null | undefined) {
  const s = store ?? {};
  const vars = buildStoreSeoVariableMap(s);
  const storeTitle = vars.title;

  const titleFromTemplate = trimmedNonEmpty(applyStoreSeoTemplate(s.seo?.privacyMetaTitle, vars));
  const title = titleFromTemplate ?? `Privacy Policy | ${storeTitle}`;

  const descFromTemplate = trimmedNonEmpty(applyStoreSeoTemplate(s.seo?.privacyMetaDescription, vars));
  const description =
    descFromTemplate ??
    `Learn how ${storeTitle} handles your personal data, comments, and contributions while keeping the site transparent.`;

  const siteUrl = resolveSiteBaseUrl(s.seo);
  const pageUrl = `${siteUrl}/privacy`;
  const keywords = resolveMetaKeywordList(s.seo?.privacyMetaKeywords, vars);

  return { title, description, pageUrl, keywords };
}

export function resolveTermsPageSeo(store: StoreDetailsForSeo | null | undefined) {
  const s = store ?? {};
  const vars = buildStoreSeoVariableMap(s);
  const storeTitle = vars.title;

  const titleFromTemplate = trimmedNonEmpty(applyStoreSeoTemplate(s.seo?.termsMetaTitle, vars));
  const title = titleFromTemplate ?? `Terms of Service | ${storeTitle}`;

  const descFromTemplate = trimmedNonEmpty(applyStoreSeoTemplate(s.seo?.termsMetaDescription, vars));
  const description =
    descFromTemplate ??
    `Read the terms of service for using ${storeTitle}, a platform for sharing publicly available giveaway CD keys.`;

  const siteUrl = resolveSiteBaseUrl(s.seo);
  const pageUrl = `${siteUrl}/terms`;
  const keywords = resolveMetaKeywordList(s.seo?.termsMetaKeywords, vars);

  return { title, description, pageUrl, keywords };
}
