import type { NextRequest } from "next/server";
import { isLikelyBotUserAgent } from "@/src/lib/api/botUserAgent";
import { isFlaggedBotUserAgent } from "@/src/lib/analytics/flaggedUserAgents";

/**
 * Server-side gate for POST /api/v1/analytics/track.
 * UA heuristics are necessary but not sufficient — headless preview crawlers often use Chrome-like UAs.
 */
export function isAutomatedAnalyticsRequest(req: NextRequest, event: string): boolean {
  const ua = req.headers.get("user-agent");
  if (isLikelyBotUserAgent(ua)) return true;

  // Real browsers virtually always send Accept-Language on fetch(); many crawlers omit it.
  const acceptLanguage = req.headers.get("accept-language");
  if (!acceptLanguage?.trim()) return true;

  if (claimsDifferentChromeVersion(req, ua)) return true;

  if (event === "page_viewed") {
    // Meta / social link expanders often POST from headless Chromium without Client Hints.
    if (looksLikeChromeWithoutClientHints(req, ua)) return true;
  }

  return false;
}

function looksLikeChromeWithoutClientHints(req: NextRequest, ua: string | null): boolean {
  if (!ua) return false;
  if (!/chrome\//i.test(ua) || /edg\//i.test(ua) || /opr\//i.test(ua)) return false;
  if (req.headers.get("sec-ch-ua")) return false;
  // Headless / automation stacks sometimes omit sec-fetch-* entirely.
  const secFetchSite = req.headers.get("sec-fetch-site");
  const secFetchMode = req.headers.get("sec-fetch-mode");
  if (!secFetchSite && !secFetchMode) return true;
  return false;
}

/**
 * Chromium browsers report their major version both in the User-Agent and in Sec-CH-UA, always the same number.
 * Scrapers that set a Chrome User-Agent on another engine version give themselves away when the two differ.
 */
function claimsDifferentChromeVersion(req: NextRequest, ua: string | null): boolean {
  const uaMajor = ua?.match(/Chrome\/(\d+)/)?.[1];
  const hints = req.headers.get("sec-ch-ua");
  if (!uaMajor || !hints) return false;
  const hinted = hints.match(/"(?:Chromium|Google Chrome)";\s*v="(\d+)"/)?.[1];
  return Boolean(hinted && hinted !== uaMajor);
}

/** `isAutomatedAnalyticsRequest`, plus user agents an admin flagged as bots on the dashboard. */
export async function isBlockedAnalyticsRequest(req: NextRequest, event: string): Promise<boolean> {
  return isAutomatedAnalyticsRequest(req, event) || (await isFlaggedBotUserAgent(req.headers.get("user-agent")));
}
