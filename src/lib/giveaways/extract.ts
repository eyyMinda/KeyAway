import crypto from "crypto";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { normalizeKey } from "@/src/lib/keyHashing";
import type { ExtractedAccount, ExtractedGiveaway, ExtractedLink, GiveawaySource } from "@/src/types/giveaways";
import type { ProgramFlow } from "@/src/types/program";
import { normalizeUrl } from "./matchProgram";

const MAIN_SELECTORS = [".entry-content", "article", "main", "#content", "body"];
const STRIP_SELECTORS = [
  "script",
  "style",
  "noscript",
  "svg",
  "iframe",
  "form",
  "nav",
  "footer",
  "aside",
  ".sidebar",
  "#sidebar",
  ".widget",
  ".comments",
  "#comments",
  ".comment_content",
  ".comment-content",
  ".commentlist",
  "#respond",
  ".comment-respond",
  ".related",
  ".related-posts",
  ".sharedaddy"
].join(", ");

const BLOCK_END = /<\/(?:p|div|li|h[1-6]|tr|td|th|section|table|ul|ol|blockquote|pre|code|dd|dt)>/gi;

const STRONG_KEY = /\b[A-Z0-9]{4,6}(?:-[A-Z0-9]{4,6}){2,7}\b/g;
const LABELED_KEY =
  /\b(?:licen[cs]e (?:key|code)|serial(?: number| key)?|registration (?:key|code)|activation (?:key|code)|reg code|giveaway (?:key|code)|product key|key|code)\s*[:：]\s*([A-Za-z0-9][A-Za-z0-9-]{6,62}[A-Za-z0-9])/gi;
const ACCOUNT =
  /\b(?:user ?name|e-?mail|login|account)\s*[:：]\s*(\S{3,80})[\s\S]{0,160}?\bpass(?:word)?\s*[:：]\s*(\S{3,80})/gi;
const EXPIRY_LABEL =
  /\b(?:valid (?:until|till|thru|through)|expires?(?: on)?|expiry date|expiration date|giveaway ends|offer ends|ends?(?: on)?|(?:available |giveaway |offer )?until|deadline)\s*[:：\-–]?\s*([^\n]{0,40})/gi;
const LINK_HINT = /giveaway|promo|free-?licen[cs]e|activat|redeem|claim|get-?free|register/i;
const EMAIL_FLOW_HINT =
  /enter your (?:e-?mail|name)|giveaway form|fill (?:in |out )?the form|(?:register|sign ?up) to (?:get|receive)|receive (?:a|your) (?:free )?(?:licen[cs]e|key|code)/i;
const SOCIAL_HOSTS = /(?:^|\.)(?:facebook|twitter|x|pinterest|reddit|linkedin|whatsapp|telegram|t|tumblr|vk|youtube|instagram)\.(?:com|me|org)$/i;

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function isoEndOfDay(y: number, m: number, d: number): string | undefined {
  if (y < 2020 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return undefined;
  const date = new Date(Date.UTC(y, m - 1, d, 23, 59, 59));
  return date.getUTCMonth() === m - 1 ? date.toISOString() : undefined;
}

function monthIndex(name: string): number {
  return MONTHS.indexOf(name.slice(0, 3).toLowerCase()) + 1;
}

/** Parses `2026-10-31`, `31.10.2026`, `Oct 31, 2026`, `October 31st 2026`, `31 October 2026`. */
export function parseLooseDate(text: string): string | undefined {
  let m = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m) return isoEndOfDay(+m[1], +m[2], +m[3]);
  m = text.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/);
  if (m) return isoEndOfDay(+m[3], +m[2], +m[1]);
  m = text.match(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/);
  if (m && monthIndex(m[1])) return isoEndOfDay(+m[3], monthIndex(m[1]), +m[2]);
  m = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})\b/);
  if (m && monthIndex(m[2])) return isoEndOfDay(+m[3], monthIndex(m[2]), +m[1]);
  return undefined;
}

function isPlausibleKey(value: string): boolean {
  if (value.length < 8 || value.length > 64) return false;
  if (!/\d/.test(value) || !/[A-Za-z]/.test(value)) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  if (/^v?\d+(\.\d+)+$/i.test(value)) return false;
  // Plain words with a digit tacked on ("windows10", "office365") are not keys.
  if (/^[a-z]+\d{1,4}$/i.test(value) && !/[A-Z].*[A-Z]/.test(value)) return false;
  return true;
}

/** Article text with line breaks kept at block boundaries. */
function readableText($: cheerio.CheerioAPI, root: cheerio.Cheerio<AnyNode>): string {
  const clone = root.clone();
  clone.find(STRIP_SELECTORS).remove();
  const html = ($.html(clone) ?? "").replace(/<br\s*\/?>/gi, "\n").replace(BLOCK_END, "$&\n");
  return cheerio
    .load(html)
    .root()
    .text()
    .split("\n")
    .map(line => line.replace(/[ \t ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function pickRoot($: cheerio.CheerioAPI, contentSelector?: string): cheerio.Cheerio<AnyNode> {
  if (contentSelector) {
    const el = $(contentSelector).first();
    if (el.length) return el;
  }
  for (const sel of MAIN_SELECTORS) {
    const el = $(sel).first();
    if (el.length && el.text().trim().length > 200) return el;
  }
  return $.root();
}

function extractKeys(text: string): string[] {
  const found = new Map<string, string>();
  const add = (raw: string) => {
    const value = raw.trim();
    if (!isPlausibleKey(value)) return;
    const norm = normalizeKey(value);
    if (!found.has(norm)) found.set(norm, value);
  };
  for (const m of text.matchAll(STRONG_KEY)) add(m[0]);
  for (const m of text.matchAll(LABELED_KEY)) {
    const before = text.slice(Math.max(0, (m.index ?? 0) - 24), m.index ?? 0);
    if (/coupon|promo|discount|voucher/i.test(before + m[0])) continue;
    add(m[1]);
  }
  return [...found.values()].slice(0, 20);
}

function extractAccounts(text: string): ExtractedAccount[] {
  const out = new Map<string, ExtractedAccount>();
  for (const m of text.matchAll(ACCOUNT)) {
    const username = m[1].replace(/[.,;]+$/, "");
    const password = m[2].replace(/[.,;]+$/, "");
    const key = username.toLowerCase();
    if (!out.has(key)) out.set(key, { username, password });
  }
  return [...out.values()].slice(0, 10);
}

function extractLinks(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>,
  pageUrl: string
): ExtractedLink[] {
  let pageHost = "";
  try {
    pageHost = new URL(pageUrl).hostname.replace(/^www\./, "");
  } catch {}
  const out = new Map<string, ExtractedLink>();
  root.find("a[href]").each((_, el) => {
    if (out.size >= 5) return false;
    const a = $(el);
    if (a.closest(STRIP_SELECTORS).length) return;
    let url: URL;
    try {
      url = new URL(a.attr("href") ?? "", pageUrl);
    } catch {
      return;
    }
    if (!/^https?:$/.test(url.protocol)) return;
    const host = url.hostname.replace(/^www\./, "");
    if (!host || host === pageHost || host.endsWith(`.${pageHost}`) || SOCIAL_HOSTS.test(host)) return;
    const label = a.text().replace(/\s+/g, " ").trim();
    if (!LINK_HINT.test(url.pathname + url.search) && !LINK_HINT.test(label)) return;
    const norm = normalizeUrl(url.toString());
    if (!out.has(norm)) out.set(norm, { url: url.toString(), ...(label && { label: label.slice(0, 120) }) });
  });
  return [...out.values()];
}

function extractVersion(title: string, text: string): string | undefined {
  const fromTitle = title.match(/\bv?(\d+(?:\.\d+){1,3})\b/);
  if (fromTitle) return fromTitle[1];
  const fromText = text.match(/\bversion\s*[:：]?\s*v?(\d+(?:\.\d+){0,3})\b/i);
  return fromText?.[1];
}

function extractValidUntil(text: string): string | undefined {
  for (const m of text.matchAll(EXPIRY_LABEL)) {
    const iso = parseLooseDate(m[1]);
    if (iso) return iso;
  }
  return undefined;
}

function guessFlow(keys: string[], accounts: ExtractedAccount[], text: string, linkOnly: boolean): ProgramFlow | undefined {
  if (linkOnly) return "link_based_cdkey";
  if (keys.length) return "cd_key";
  if (accounts.length) return "account";
  if (EMAIL_FLOW_HINT.test(text)) return "link_based_cdkey";
  return undefined;
}

export function hashExtracted(data: Omit<ExtractedGiveaway, "contentHash" | "excerpt" | "detectedFlow">): string {
  const payload = JSON.stringify({
    k: data.keys.map(normalizeKey).sort(),
    a: data.accounts.map(a => a.username.toLowerCase()).sort(),
    l: data.links.map(l => normalizeUrl(l.url)).sort(),
    v: data.version ?? "",
    e: data.validUntil ?? ""
  });
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 32);
}

/** Best-effort extraction of giveaway details from a detail page or feed/API post body. */
export function extractGiveaway(input: {
  html: string;
  pageUrl: string;
  title: string;
  source?: GiveawaySource;
}): ExtractedGiveaway {
  const $ = cheerio.load(input.html);
  const root = pickRoot($, input.source?.contentSelector);
  const text = readableText($, root);
  const linkOnly = Boolean(input.source?.linkOnly);

  const keys = linkOnly ? [] : extractKeys(text);
  const accounts = linkOnly ? [] : extractAccounts(text);
  const links = extractLinks($, root, input.pageUrl);
  const version = extractVersion(input.title, text);
  const validUntil = extractValidUntil(text);

  const base = { keys, accounts, links, version, validUntil };
  const excerpt = text.replace(/\s+/g, " ").trim().slice(0, 300) || undefined;
  const pageTitle =
    (root.find("h1").first().text() || $("h1").first().text() || $("title").first().text()).replace(/\s+/g, " ").trim() ||
    undefined;
  return {
    ...base,
    detectedFlow: guessFlow(keys, accounts, text, linkOnly),
    excerpt,
    pageTitle,
    contentHash: hashExtracted(base)
  };
}
