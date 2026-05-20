import { DEFAULT_STORE_NAME, DEFAULT_SITE_URL } from "@/src/lib/seo/storeSeoResolve";

function toUrl(urlOrDomain: string): URL | null {
  const value = urlOrDomain.trim();
  if (!value) return null;

  try {
    return new URL(value);
  } catch {
    try {
      return new URL(`https://${value}`);
    } catch {
      return null;
    }
  }
}

export function resolveStoreDomain(siteUrl?: string): string {
  const parsed = toUrl(siteUrl ?? "") ?? toUrl(DEFAULT_SITE_URL);
  if (!parsed) return "keyaway.app";
  return `${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function resolveStoreDisplayName(title?: string, siteUrl?: string): string {
  const storeTitle = title?.trim() || DEFAULT_STORE_NAME;
  const domain = resolveStoreDomain(siteUrl);
  return `${storeTitle} (${domain})`;
}

export function resolveStoreWebsiteHref(siteUrl?: string): string {
  const parsed = toUrl(siteUrl ?? "") ?? toUrl(DEFAULT_SITE_URL);
  return parsed?.toString() ?? DEFAULT_SITE_URL;
}
