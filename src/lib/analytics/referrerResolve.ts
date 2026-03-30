/** @fileoverview Page-view referrer chain: `?referrer=` on current URL, then SPA previous URL, then document.referrer; unwraps nested attribution URLs for admin Top Referrers. */
const SITE_ORIGIN = "https://www.keyaway.app";

function parseStoredToUrl(stored: string): URL | null {
  try {
    const s = stored.trim();
    if (!s) return null;
    if (s.startsWith("http://") || s.startsWith("https://")) return new URL(s);
    const path = s.startsWith("/") ? s : `/${s}`;
    return new URL(path, SITE_ORIGIN);
  } catch {
    return null;
  }
}

function parseInnerReferrerParam(param: string): URL | null {
  const t = param.trim();
  if (!t) return null;
  try {
    if (t.startsWith("http://") || t.startsWith("https://")) return new URL(t);
    return new URL(t, SITE_ORIGIN);
  } catch {
    return null;
  }
}

/**
 * Prefer, in order: `referrer` query on the **current** page URL (attribution link),
 * then previous full URL (SPA, including its query), then `document.referrer`.
 */
export function primaryReferrerForPageView(opts: {
  currentHref: string;
  documentReferrer?: string;
  previousFullUrl?: string;
}): string | undefined {
  try {
    const u = new URL(opts.currentHref);
    const raw = u.searchParams.get("referrer")?.trim();
    if (raw) {
      const inner = parseInnerReferrerParam(raw);
      if (inner) return inner.href;
    }
  } catch {
    // invalid currentHref
  }
  const prev = opts.previousFullUrl?.trim();
  if (prev) return prev;
  const ext = opts.documentReferrer?.trim();
  return ext || undefined;
}

/**
 * When the stored referrer is e.g. https://www.keyaway.app/x?referrer=https://reddit.com,
 * use the inner URL for bucketing/display so Top Referrers attributes traffic to reddit.com.
 */
export function resolveEffectiveReferrer(storedReferrer: string | undefined): {
  effectiveHref: string;
  hostname: string;
  /** Only set when the *effective* URL itself has a `referrer` query (nested campaign param) */
  nestedReferrerParam?: string;
} {
  if (!storedReferrer?.trim()) {
    return { effectiveHref: "", hostname: "www.keyaway.app" };
  }

  const outer = parseStoredToUrl(storedReferrer);
  if (!outer) {
    return { effectiveHref: storedReferrer.trim(), hostname: "www.keyaway.app" };
  }

  const outerParam = outer.searchParams.get("referrer")?.trim();
  if (outerParam) {
    const inner = parseInnerReferrerParam(outerParam);
    if (inner) {
      const nested = inner.searchParams.get("referrer")?.trim();
      return {
        effectiveHref: inner.href,
        hostname: inner.hostname,
        nestedReferrerParam: nested || undefined
      };
    }
  }

  return {
    effectiveHref: outer.href,
    hostname: outer.hostname
  };
}
