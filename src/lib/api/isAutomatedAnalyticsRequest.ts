import type { NextRequest } from "next/server";
import { isLikelyBotUserAgent } from "@/src/lib/api/botUserAgent";

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
