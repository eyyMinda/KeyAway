/**
 * @fileoverview Scrapes vendor pages for program/vendor prefill: metadata, structured data, version text,
 * download links, content sections with bullets, FAQs and candidate images. Vendor-specific FAQ sources
 * (IObit's all-FAQ page filtered by product) are merged in.
 *
 * Self-contained on purpose (only `cheerio`, type-only imports): the admin API imports it, and
 * `scripts/prefillScrape.mjs` runs it straight from Node for the Claude Code prefill command.
 */
import * as cheerio from "cheerio";
import type { Cheerio, CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";
import type { InstallerInfo } from "../versions/installerVersion";
import type { PressKit } from "./pressKit";

export interface ScrapedFaq {
  question: string;
  /** Markdown. */
  answer: string;
  source: string;
}

export interface ScrapedSection {
  heading: string;
  /** Paragraph text under the heading (markdown, paragraphs separated by blank lines). */
  text: string;
  bullets: string[];
}

export interface ScrapedImage {
  url: string;
  alt?: string;
  /** Where it was found: og image, page image, logo/icon. */
  kind: "og" | "page" | "logo";
}

export interface ScrapedPage {
  url: string;
  title: string;
  metaDescription: string;
  siteName: string;
  structured: {
    name?: string;
    version?: string;
    operatingSystem?: string;
    publisher?: string;
    description?: string;
    downloadUrl?: string;
  };
  /** Version-looking strings found in the page text ("Version 14.0.1"), highest first. */
  versionCandidates: string[];
  downloadLinks: string[];
  platforms: ("windows" | "mac")[];
  sections: ScrapedSection[];
  faqs: ScrapedFaq[];
  images: ScrapedImage[];
  /** Cleaned main text, capped, for the AI prompt. */
  text: string;
}

export interface ScrapeResult {
  pages: ScrapedPage[];
  /** FAQs from every page and vendor-specific sources, de-duplicated. */
  faqs: ScrapedFaq[];
  errors: { url: string; error: string }[];
  /** The vendor's Windows installer found among the download links (version read from the .exe). */
  installer?: InstallerInfo | null;
  /** The vendor's press kit for this product (product info, what's new, FAQ, screenshots). */
  pressKit?: PressKit | null;
}

/** Extra first-party sources added after the pages are scraped (installer, press kit). */
export type PrefillExtras = (ctx: {
  urls: string[];
  productName: string;
  pages: ScrapedPage[];
}) => Promise<Pick<ScrapeResult, "installer" | "pressKit"> & { errors?: ScrapeResult["errors"] }>;

const TIMEOUT_MS = 15_000;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const MAX_TEXT = 14_000;
/** Site chrome removed before reading content (menus are full of other products' names and links). */
const STRIP = [
  "script, style, noscript, svg, iframe, form, nav, header, footer",
  ".header, #header, .footer, #footer, [class*=menu], [id*=menu], [class*=navbar], [class*=nav-], [class*=-nav], [class*=gnav], [class*=dropdown]",
  "[class*=cookie], [class*=banner-ad], [class*=breadcrumb], [class*=lang-list]"
].join(", ");
const PROMO_RE = /pop|banner|promo|sale|coupon|discount|halloween|christmas|xmas|black-?friday|cyber-?monday|new-?year|easter|countdown/i;
const QUESTION_START = /^(how|what|why|can|could|is|are|does|do|did|will|would|where|when|which|who|should|may|i |my )/i;
const VERSION_RE = /\b(?:version|ver\.?|v)\s*[:\-]?\s*(\d+(?:\.\d+){1,3})\b/gi;

const clean = (s: string | undefined | null) => (s ?? "").replace(/\s+/g, " ").trim();

function numericCompare(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

/** Version-looking strings in text, highest first. `pattern` = custom regex with one capture group. */
export function versionCandidates(text: string, pattern?: string | null): string[] {
  const re = pattern?.trim() ? new RegExp(pattern, "gi") : VERSION_RE;
  const found = [...text.matchAll(re)].map(m => (m[1] ?? m[0]).trim()).filter(v => /^\d+(?:\.\d+)*$/.test(v));
  return [...new Set(found)].sort((a, b) => numericCompare(b, a));
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml", "Accept-Language": "en" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: "follow"
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function absolute(href: string | undefined, base: string): string | null {
  if (!href || href.startsWith("data:") || href.startsWith("javascript:")) return null;
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

/** Element content as light Markdown (paragraphs, line breaks, bullets, bold). */
function toMarkdown($: CheerioAPI, el: Cheerio<AnyNode>): string {
  const walk = (node: AnyNode): string => {
    if (node.type === "text") return (node as unknown as { data: string }).data.replace(/\s+/g, " ");
    if (node.type !== "tag") return "";
    const tag = (node as unknown as { name: string }).name;
    const inner = $(node)
      .contents()
      .toArray()
      .map(walk)
      .join("");
    switch (tag) {
      case "br":
        return "\n";
      case "p":
      case "div":
      case "section":
        return `\n\n${inner.trim()}\n\n`;
      case "li":
        return `\n- ${inner.trim()}`;
      case "ul":
      case "ol":
        return `\n${inner}\n\n`;
      case "strong":
      case "b":
        return inner.trim() ? `**${inner.trim()}** ` : "";
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
        return `\n\n**${inner.trim()}**\n\n`;
      default:
        return inner;
    }
  };
  return el
    .contents()
    .toArray()
    .map(walk)
    .join("")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function jsonLdItems($: CheerioAPI): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).text());
      const push = (v: unknown) => {
        if (Array.isArray(v)) v.forEach(push);
        else if (v && typeof v === "object") {
          const o = v as Record<string, unknown>;
          if (Array.isArray(o["@graph"])) push(o["@graph"]);
          out.push(o);
        }
      };
      push(data);
    } catch {
      /* invalid JSON-LD: ignore */
    }
  });
  return out;
}

const typeIs = (o: Record<string, unknown>, t: string) =>
  ([] as unknown[]).concat(o["@type"] ?? []).some(x => typeof x === "string" && x.toLowerCase().includes(t.toLowerCase()));

function extractFaqs($: CheerioAPI, url: string, ld: Record<string, unknown>[]): ScrapedFaq[] {
  const faqs: ScrapedFaq[] = [];
  const add = (q: string, a: string) => {
    const question = clean(q);
    const answer = a.trim();
    const looksLikeQuestion = question.endsWith("?") || QUESTION_START.test(question);
    if (looksLikeQuestion && question.length > 8 && question.length < 300 && answer.length > 10) faqs.push({ question, answer, source: url });
  };

  for (const item of ld.filter(o => typeIs(o, "FAQPage"))) {
    for (const q of ([] as unknown[]).concat(item.mainEntity ?? [])) {
      const qo = q as { name?: string; acceptedAnswer?: { text?: string } };
      const answerHtml = qo.acceptedAnswer?.text ?? "";
      add(qo.name ?? "", toMarkdown($, cheerio.load(`<div>${answerHtml}</div>`)("div").first()) || clean(answerHtml));
    }
  }
  $("details").each((_, el) => {
    const summary = $(el).find("summary").first();
    const q = summary.text();
    summary.remove();
    add(q, toMarkdown($, $(el)));
  });
  $("dl").each((_, dl) => {
    $(dl)
      .find("dt")
      .each((__, dt) => add($(dt).text(), toMarkdown($, $(dt).nextUntil("dt", "dd"))));
  });
  // Headings phrased as questions, answered by what follows them.
  $("h2, h3, h4, h5, [class*=question], [class*=faq-title], [class*=faq_title]").each((_, el) => {
    const q = clean($(el).text());
    if (!q.endsWith("?")) return;
    const answerEl = $(el).is("[class*=question]") ? $(el).next("[class*=answer]") : $(el).nextUntil("h1, h2, h3, h4, h5");
    add(q, toMarkdown($, answerEl.length ? answerEl : $(el).parent().find("[class*=answer]").first()));
  });
  return faqs;
}

function extractSections($: CheerioAPI, main: Cheerio<AnyNode>): ScrapedSection[] {
  const sections: ScrapedSection[] = [];
  const seen = new Set<string>();
  main.find("h2, h3").each((_, h) => {
    // Drop badge words vendors tack onto headings ("Fix Missing DLLs NEW").
    const heading = clean($(h).text()).replace(/\s+(new|hot|beta|free)!?$/i, "");
    if (!heading || heading.length > 140 || heading.endsWith("?") || !/[a-z]{3}/i.test(heading) || seen.has(heading.toLowerCase())) return;
    const body = $(h).nextUntil("h1, h2, h3");
    const scope = body.length ? body : $(h).parent().children().not(h);
    const paragraphs = scope
      .filter("p, div")
      .toArray()
      .map(p => clean($(p).text()))
      .filter(t => t.length > 30);
    const bullets = scope
      .find("li")
      .addBack("li")
      .toArray()
      .map(li => clean($(li).text()))
      .filter(t => t.length > 3 && t.length < 300)
      .slice(0, 10);
    const text = [...new Set(paragraphs)].slice(0, 4).join("\n\n");
    if (!text && bullets.length === 0) return;
    seen.add(heading.toLowerCase());
    sections.push({ heading, text, bullets });
  });
  // A wrapper section repeats its sub-sections' text; keep the sub-sections.
  const isWrapper = (s: ScrapedSection) => sections.filter(o => o !== s && s.text.includes(o.heading)).length >= 2;
  return sections.filter(s => !isWrapper(s)).slice(0, 30);
}

function extractImages($: CheerioAPI, main: Cheerio<AnyNode>, url: string): ScrapedImage[] {
  const images: ScrapedImage[] = [];
  const seen = new Set<string>();
  const add = (src: string | undefined, kind: ScrapedImage["kind"], alt?: string) => {
    const abs = absolute(src, url);
    if (!abs || seen.has(abs) || /\.svg(\?|$)/i.test(abs) || /sprite|pixel|tracking|spacer|blank\.gif/i.test(abs)) return;
    // Seasonal promos and sale popups are not product imagery.
    if (kind === "page" && (PROMO_RE.test(abs) || /\d+\s*% ?off|^\$\d*$|^boo!?$/i.test(alt?.trim() ?? ""))) return;
    seen.add(abs);
    images.push({ url: abs, kind, ...(alt ? { alt: clean(alt) } : {}) });
  };
  add($('meta[property="og:image"]').attr("content"), "og");
  add($('meta[name="twitter:image"]').attr("content"), "og");
  $('link[rel="apple-touch-icon"], link[rel="icon"][sizes]').each((_, el) => add($(el).attr("href"), "logo"));
  $("img[src*=logo], img[class*=logo], img[alt*=logo i]").slice(0, 3).each((_, el) => add($(el).attr("src"), "logo", $(el).attr("alt")));
  main.find("img").each((_, el) => {
    const src = $(el).attr("data-src") ?? $(el).attr("data-original") ?? $(el).attr("src");
    const w = Number($(el).attr("width") ?? 0);
    if (w && w < 160) return;
    if (/icon|logo|avatar|badge|flag|star|arrow/i.test(src ?? "")) return;
    add(src, "page", $(el).attr("alt"));
  });
  return images.slice(0, 24);
}

/** Scrapes one page. */
export async function scrapePage(url: string): Promise<ScrapedPage> {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const ld = jsonLdItems($);
  const app = ld.find(o => typeIs(o, "SoftwareApplication") || typeIs(o, "Product")) ?? {};
  const publisher = app.publisher ?? app.author ?? app.brand;
  const title = clean($("title").first().text());
  const metaDescription = clean($('meta[name="description"]').attr("content") ?? $('meta[property="og:description"]').attr("content"));
  const siteName = clean($('meta[property="og:site_name"]').attr("content"));
  const headImages = extractImages($, $("head"), url);
  $(STRIP).remove();
  const faqs = extractFaqs($, url, ld);

  const downloadLinks = [
    ...new Set(
      $("a[href]")
        .toArray()
        .filter(a => {
          const href = $(a).attr("href") ?? "";
          return /\.(exe|msi|dmg|pkg)(\?|$)/i.test(href) || /download/i.test(href) || /^\s*(free )?download/i.test($(a).text());
        })
        .map(a => absolute($(a).attr("href"), url))
        .filter((h): h is string => !!h && !/#$/.test(h))
    )
  ].slice(0, 6);
  if (typeof app.downloadUrl === "string") downloadLinks.unshift(app.downloadUrl);

  const main = $("main").first().length ? $("main").first() : $("article").first().length ? $("article").first() : $("body");
  const text = clean(main.text());
  const lower = text.toLowerCase();
  const platforms: ("windows" | "mac")[] = [];
  if (/windows\s*(11|10|8|7|xp|vista)|for windows|\bwin(dows)?\b/.test(lower)) platforms.push("windows");
  if (/macos|mac os|for mac\b|apple silicon/.test(lower)) platforms.push("mac");

  return {
    url,
    title,
    metaDescription,
    siteName,
    structured: {
      name: typeof app.name === "string" ? clean(app.name) : undefined,
      version: typeof app.softwareVersion === "string" ? clean(app.softwareVersion) : undefined,
      operatingSystem: typeof app.operatingSystem === "string" ? clean(app.operatingSystem) : undefined,
      publisher:
        typeof publisher === "string"
          ? publisher
          : publisher && typeof (publisher as { name?: unknown }).name === "string"
            ? (publisher as { name: string }).name
            : undefined,
      description: typeof app.description === "string" ? clean(app.description) : undefined,
      downloadUrl: typeof app.downloadUrl === "string" ? app.downloadUrl : undefined
    },
    versionCandidates: versionCandidates(`${title} ${text}`),
    downloadLinks: [...new Set(downloadLinks)],
    platforms,
    sections: extractSections($, main),
    faqs,
    images: [...headImages, ...extractImages($, main, url).filter(i => !headImages.some(h => h.url === i.url))].slice(0, 24),
    text: text.slice(0, MAX_TEXT)
  };
}

// ---------------------------------------------------------------------------------------------------------
// Vendor-specific FAQ sources
// ---------------------------------------------------------------------------------------------------------

/** Lowercase, drop vendor/edition words, so "IObit Driver Booster Pro" matches "Driver Booster". */
export function productKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(iobit|itop|aomei|softorbits|free|pro|ultimate|premium|for windows|for mac)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

interface VendorFaqSource {
  matches: (url: string) => boolean;
  fetchFaqs: (productName: string) => Promise<ScrapedFaq[]>;
}

/** IObit lists every product's FAQs on one page: `<h2>Product</h2>` followed by `<dl><dt>Q</dt><dd>A</dd></dl>`. */
const iobitFaqs: VendorFaqSource = {
  matches: url => /(^|\.)iobit\.com$/i.test(new URL(url).hostname),
  async fetchFaqs(productName) {
    const source = "https://www.iobit.com/en/allfaq.php";
    const $ = cheerio.load(await fetchHtml(source));
    const key = productKey(productName);
    const heading = $("h2")
      .toArray()
      .map(h => ({ h, k: productKey($(h).text()) }))
      .filter(({ k }) => k && (k === key || key.startsWith(k) || k.startsWith(key)))
      .sort((a, b) => b.k.length - a.k.length)[0]?.h;
    if (!heading) return [];
    const faqs: ScrapedFaq[] = [];
    $(heading)
      .nextUntil("h2")
      .find("dt")
      .addBack("dt")
      .each((_, dt) => {
        const question = clean($(dt).text());
        const answer = toMarkdown($, $(dt).nextUntil("dt", "dd"));
        if (question && answer) faqs.push({ question, answer, source: `${source}#${$(heading).attr("id") ?? ""}` });
      });
    return faqs;
  }
};

const VENDOR_FAQ_SOURCES: VendorFaqSource[] = [iobitFaqs];

/**
 * Scrapes every URL (first one = the product page) and merges vendor FAQ sources.
 * `productName` picks the right product on vendor FAQ pages; defaults to the page's product name.
 */
export async function scrapeForPrefill(opts: { urls: string[]; productName?: string; extras?: PrefillExtras }): Promise<ScrapeResult> {
  const urls = [...new Set(opts.urls.map(u => u.trim()).filter(Boolean))].slice(0, 5);
  const pages: ScrapedPage[] = [];
  const errors: { url: string; error: string }[] = [];
  await Promise.all(
    // Zip URLs are press kits, read by `extras`, not web pages.
    urls.filter(url => !/\.zip(\?|$)/i.test(url)).map(async url => {
      try {
        pages.push(await scrapePage(url));
      } catch (err) {
        errors.push({ url, error: err instanceof Error ? err.message : "Failed" });
      }
    })
  );
  pages.sort((a, b) => urls.indexOf(a.url) - urls.indexOf(b.url));

  const faqs = pages.flatMap(p => p.faqs);
  const first = pages[0];
  const name = opts.productName?.trim() || first?.structured.name || first?.title.split(/[|\-–—:]/)[0] || "";
  for (const source of VENDOR_FAQ_SOURCES) {
    if (!name || !urls.some(u => source.matches(u))) continue;
    try {
      faqs.push(...(await source.fetchFaqs(name)));
    } catch (err) {
      errors.push({ url: "vendor FAQ page", error: err instanceof Error ? err.message : "Failed" });
    }
  }

  let extra: Awaited<ReturnType<PrefillExtras>> = {};
  if (opts.extras && (name || urls.some(u => /\.zip(\?|$)/i.test(u)))) {
    try {
      extra = await opts.extras({ urls, productName: name, pages });
      errors.push(...(extra.errors ?? []));
    } catch (err) {
      errors.push({ url: "installer / press kit", error: err instanceof Error ? err.message : "Failed" });
    }
  }
  // Press kit FAQs are written for this exact release: list them first.
  const kitFaqs = (extra.pressKit?.faqs ?? []).map(f => ({ ...f, source: extra.pressKit!.url }));

  const seen = new Set<string>();
  const unique = [...kitFaqs, ...faqs].filter(f => {
    const k = f.question.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return { pages, faqs: unique.slice(0, 40), errors, installer: extra.installer ?? null, pressKit: extra.pressKit ?? null };
}
