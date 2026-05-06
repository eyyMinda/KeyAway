/**
 * Heuristic bot / automated client detection from User-Agent (server-side).
 * Used to skip analytics and key-report writes — not a security boundary.
 *
 * Mirrors storefront crawler lists + extra generic/http-library patterns. No `navigator`
 * here (API routes); optional `Sec-CH-UA` hints can be folded in later if needed.
 */

/** Named crawlers / preview bots (must stay in sync with storefront guard where possible). */
const EXPLICIT_CRAWLER_RE =
  /googlebot|adsbot-google|textadsbot-google|mediapartners-google|google-adwords|feedfetcher-google|apis-google|storebot-google|googleproducer|adsbot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebot|facebookexternalhit|twitterbot|pinterestbot|linkedinbot|slackbot|telegrambot|whatsapp|applebot/i;

/** Browser automation / headless (UA substring — no `navigator.webdriver` on server). */
const AUTOMATION_UA_RE = /(headless|phantomjs|puppeteer|playwright|webdriver|headlesschrome)/i;

/**
 * Everything else: generic bots, SEO tools, archives, CLI HTTP clients, etc.
 * Kept alongside EXPLICIT_CRAWLER_RE so behavior stays at least as broad as before.
 */
const ADDITIONAL_BOT_HEURISTIC_RE =
  /\bbot\b|crawl|spider|embedly|quora link preview|pinterest|discordbot|preview|lighthouse|pingdom|uptime|statuscake|semrush|ahrefs|mj12bot|dotbot|bytespider|petalbot|yandex|ia_archiver|archive\.org|wget|curl\/|libwww|python-requests|go-http|java\/|axios|httpie|scrapy|prerender|sitebulb|screaming frog/i;

export function isLikelyBotUserAgent(userAgent: string | undefined | null): boolean {
  if (!userAgent || !userAgent.trim()) return false;

  const ua = userAgent;
  if (EXPLICIT_CRAWLER_RE.test(ua)) return true;
  if (AUTOMATION_UA_RE.test(ua)) return true;
  if (ADDITIONAL_BOT_HEURISTIC_RE.test(ua)) return true;

  return false;
}
