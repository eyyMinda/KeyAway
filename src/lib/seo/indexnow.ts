import { DEFAULT_SITE_URL } from "@/src/lib/seo/storeSeoResolve";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const INDEXNOW_KEY = "c2ead36245bf40d2b1f28d4b3ec68d09";
const INDEXNOW_KEY_FILE = `${INDEXNOW_KEY}.txt`;

function resolveSiteBaseUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const fallback = DEFAULT_SITE_URL;

  try {
    return new URL(configured || fallback);
  } catch {
    return new URL(fallback);
  }
}

export function buildSiteUrl(pathname: string): string {
  const base = resolveSiteBaseUrl();
  return new URL(pathname, base).toString();
}

function normalizeIndexNowUrls(urls: string[], siteHost: string): string[] {
  const deduped = new Set<string>();

  for (const raw of urls) {
    if (!raw) continue;
    try {
      const parsed = new URL(raw);
      if (!["http:", "https:"].includes(parsed.protocol)) continue;
      if (parsed.host !== siteHost) continue;
      deduped.add(parsed.toString());
    } catch {
      continue;
    }
  }

  return [...deduped];
}

export async function submitIndexNow(urls: string[]): Promise<void> {
  const siteBase = resolveSiteBaseUrl();
  const urlList = normalizeIndexNowUrls(urls, siteBase.host);
  if (urlList.length === 0) return;

  const keyLocation = buildSiteUrl(`/${INDEXNOW_KEY_FILE}`);

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: siteBase.host,
        key: INDEXNOW_KEY,
        keyLocation,
        urlList
      })
    });

    if (!response.ok) {
      const body = await response.text();
      console.warn("[indexnow] submit failed", {
        status: response.status,
        reason: body.slice(0, 300),
        count: urlList.length
      });
      return;
    }

    console.info("[indexnow] submit ok", { count: urlList.length });
  } catch (error) {
    console.warn("[indexnow] submit error", {
      error: error instanceof Error ? error.message : String(error),
      count: urlList.length
    });
  }
}
