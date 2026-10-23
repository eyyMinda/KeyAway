/**
 * @fileoverview The prefill result format shared by the admin "Prefill" dialog and the Claude Code
 * `/prefill-program` and `/prefill-vendor` commands, plus the KeyAway writing rules and the AI prompt.
 *
 * Flow: scrape vendor pages (`scrapePage.ts`) -> either apply the scraped data directly
 * (`scrapeToProgramPrefill`) or let an AI write a `PrefillResult` JSON from it (`buildProgramPrompt`,
 * pasted into Claude/ChatGPT, or produced by Claude Code) -> paste it into the admin editor
 * (`parsePrefillResult`) -> review -> save.
 *
 * All text fields use the editor's Markdown: **bold**, *italic*, `- ` bullets, `### ` headings, [links](url).
 */
import type { ScrapeResult } from "./scrapePage";

export interface PrefillProgram {
  title?: string;
  slug?: string;
  /** Vendor name; matched to an existing vendor. */
  vendor?: string;
  /** Category titles; only existing categories are applied. */
  categories?: string[];
  platforms?: ("windows" | "mac")[];
  /** major.minor, e.g. "14.0". */
  latestOfficialVersion?: string;
  downloadLink?: string;
  /** 2–3 sentences, Markdown. */
  description?: string;
  aboutSections?: { title?: string; description: string; points?: string[]; imageUrl?: string }[];
  faq?: { question: string; answer: string }[];
  freeVsPro?: { feature: string; free?: string; pro?: string }[];
  seo?: { metaTitle?: string; metaDescription?: string; metaKeywords?: string[] };
  /** Other names giveaway sites use for the program. */
  aliases?: string[];
  /** Main program image (absolute URL); imported into Sanity on apply. */
  imageUrl?: string;
  /** Where the daily version check should look. */
  versionCheck?: {
    source: "installer" | "page" | "winget" | "chocolatey" | "homebrew";
    installerUrl?: string;
    pageUrl?: string;
    packageId?: string;
  };
}

export interface PrefillVendor {
  name?: string;
  slug?: string;
  description?: string;
  aliases?: string[];
  giveawayVsOfficial?: { feature: string; giveaway?: string; officialPro?: string }[];
  seo?: { metaTitle?: string; metaDescription?: string };
  logoUrl?: string;
}

export interface PrefillResult {
  kind: "program" | "vendor";
  program?: PrefillProgram;
  vendor?: PrefillVendor;
}

// ---------------------------------------------------------------------------------------------------------
// Writing rules (used verbatim in the AI prompt and by the Claude Code commands)
// ---------------------------------------------------------------------------------------------------------

export const PROGRAM_WRITING_RULES = `KeyAway lists PC software with free giveaway license keys. Program pages must read as honest, original and useful to someone deciding whether to try the program.

General
- Plain, friendly English. No hype ("best", "ultimate", "revolutionary"), no prices, discounts, coupons or sale dates.
- Only state facts supported by the sources. If something is unknown, leave the field out instead of guessing.
- Vendor pages repeat the same claim many times in different words: say each thing once, in the place it fits best.
- Write in your own words. Do not copy marketing sentences verbatim.
- Markdown only: **bold**, *italic*, "- " bullets, [links](https://...).

Fields
- title: the product name as people search for it, with the vendor prefix if the brand uses it (e.g. "IObit Driver Booster"). No edition ("Free"/"Pro") or version.
- description: 2–3 sentences (40–70 words): what the program does, who it is for, the main benefit. Unique to this program.
- aboutSections: 3–4 sections, each a distinct feature area (not overlapping each other or the description).
  - title: short (max ~60 chars).
  - description: 1–3 sentences.
  - points: 3–5 bullets, each "**Feature name:** what it does for the user." Max ~140 chars each.
- faq: 4–8 questions real users ask. Prefer the scraped FAQs (rewrite for clarity, keep the facts). Skip questions about purchases, refunds, renewals or transferring paid licenses. Answers 1–4 sentences.
  If no FAQs were found, write them from facts in the sources (system requirements, what the program does, free vs paid edition, safety, how to activate a license key).
- freeVsPro: 4–8 rows comparing the free edition with the paid PRO edition, only from sources. feature = short label ("Driver database"), free/pro = short values ("Basic", "4.5M+ drivers"). Omit if the program has no free edition or the sources do not say.
- seo.metaTitle: max 60 chars. seo.metaDescription: max 155 chars, a call to action is fine. seo.metaKeywords: 3–6 search phrases.
- aliases: other names giveaway sites may use (spacing/abbreviation variants). Leave out the vendor name and editions.
- latestOfficialVersion: major.minor only ("14.0"). Trust the installer and press kit versions over page text.
- Images: imageUrl / aboutSections[].imageUrl may be a scraped image URL or a press kit reference ("presskit:…"); use press kit screenshots that match each about section's topic.
- versionCheck: when an installer was found, use { "source": "installer", "installerUrl": "<its URL>" }; otherwise { "source": "page", "pageUrl": "<product page>" } if the page shows a version.
- categories: pick only from the list given. vendor: the publisher's brand name.
- platforms: "windows" and/or "mac".`;

export const VENDOR_WRITING_RULES = `KeyAway vendor hub pages introduce a software publisher whose programs appear on KeyAway with giveaway keys.

- description: 2 short paragraphs. First: who the publisher is and what kind of software it makes (name 1–3 well-known products). Second: why its programs are worth a look and that full versions sometimes appear as free giveaways. Plain English, no hype, no prices.
- aliases: other spellings of the brand on giveaway sites ("iObit", "Aomei Tech").
- giveawayVsOfficial: 5–7 honest rows comparing a community giveaway key with an official PRO license (price, how long it lasts, version lock, updates, activation slots, support). Keep values short.
- seo.metaTitle: max 60 chars. seo.metaDescription: max 155 chars.
- Only facts supported by the sources; leave unknown fields out.`;

export const PROGRAM_RESULT_SHAPE = `{
  "kind": "program",
  "program": {
    "title": "IObit Driver Booster",
    "vendor": "IObit",
    "categories": ["Driver tools"],
    "platforms": ["windows"],
    "latestOfficialVersion": "14.0",
    "downloadLink": "https://...",
    "description": "Markdown…",
    "aboutSections": [{ "title": "…", "description": "Markdown…", "points": ["**Feature:** …"], "imageUrl": "https://… (optional, from the scraped images)" }],
    "faq": [{ "question": "…?", "answer": "Markdown…" }],
    "freeVsPro": [{ "feature": "…", "free": "…", "pro": "…" }],
    "seo": { "metaTitle": "…", "metaDescription": "…", "metaKeywords": ["…"] },
    "aliases": ["…"],
    "imageUrl": "https://… (optional)",
    "versionCheck": { "source": "installer", "installerUrl": "https://…" }
  }
}`;

export const VENDOR_RESULT_SHAPE = `{
  "kind": "vendor",
  "vendor": {
    "name": "IObit",
    "description": "Markdown…",
    "aliases": ["…"],
    "giveawayVsOfficial": [{ "feature": "…", "giveaway": "…", "officialPro": "…" }],
    "seo": { "metaTitle": "…", "metaDescription": "…" },
    "logoUrl": "https://… (optional)"
  }
}`;

// ---------------------------------------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------------------------------------

const cap = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);

/** Scraped data as compact text for an AI prompt. */
export function scrapeToText(scrape: ScrapeResult, opts: { maxPageText?: number } = {}): string {
  const out: string[] = [];
  const inst = scrape.installer;
  if (inst) {
    out.push("## Vendor installer (version read from the .exe)");
    out.push(`URL: ${inst.url}`);
    out.push(`Version: ${inst.productVersion ?? ""}${inst.fileVersion && inst.fileVersion !== inst.productVersion ? ` (file ${inst.fileVersion})` : ""}`);
    if (inst.releasedAt) out.push(`File date (release): ${inst.releasedAt.slice(0, 10)}`);
    if (inst.productName) out.push(`Product name: ${inst.productName}`);
    out.push("");
  }
  const kit = scrape.pressKit;
  if (kit) {
    out.push(`## Official press kit: ${kit.url}`);
    for (const [label, value] of [
      ["Product", kit.productName],
      ["Version", kit.version],
      ["Release date", kit.releaseDate],
      ["Works in", kit.worksIn],
      ["Download URL", kit.downloadUrl]
    ]) {
      if (value) out.push(`${label}: ${value}`);
    }
    if (kit.whatsNew.length) out.push(`What's new:\n${kit.whatsNew.map(w => `- ${w}`).join("\n")}`);
    if (kit.description) out.push(`Description:\n${cap(kit.description, 3000)}`);
    if (kit.pressRelease) out.push(`Press release:\n${cap(kit.pressRelease, 4000)}`);
    if (kit.images.length) out.push(`Press kit images (use the reference as imageUrl):\n${kit.images.map(i => `- ${i.kind} "${i.name}": ${i.ref}`).join("\n")}`);
    out.push("");
  }
  for (const p of scrape.pages) {
    out.push(`## Page: ${p.url}`);
    out.push(`Title: ${p.title}`);
    if (p.metaDescription) out.push(`Meta description: ${p.metaDescription}`);
    const st = Object.entries(p.structured).filter(([, v]) => v);
    if (st.length) out.push(`Structured data: ${st.map(([k, v]) => `${k}=${v}`).join("; ")}`);
    if (p.versionCandidates.length) out.push(`Versions mentioned: ${p.versionCandidates.slice(0, 5).join(", ")}`);
    if (p.downloadLinks.length) out.push(`Download links: ${p.downloadLinks.slice(0, 3).join(", ")}`);
    if (p.platforms.length) out.push(`Platforms mentioned: ${p.platforms.join(", ")}`);
    if (p.sections.length) {
      out.push("Sections:");
      for (const s of p.sections) {
        out.push(`### ${s.heading}`);
        if (s.text) out.push(cap(s.text, 900));
        for (const b of s.bullets) out.push(`- ${b}`);
      }
    }
    const imgs = p.images.filter(i => i.kind !== "logo").slice(0, 10);
    if (imgs.length) out.push(`Images: ${imgs.map(i => `${i.url}${i.alt ? ` (${i.alt})` : ""}`).join(" | ")}`);
    out.push(`Page text (excerpt): ${cap(p.text, opts.maxPageText ?? 6000)}`);
    out.push("");
  }
  if (scrape.faqs.length) {
    out.push("## FAQs found");
    for (const f of scrape.faqs) out.push(`Q: ${f.question}\nA: ${cap(f.answer, 700)}`);
  }
  return out.join("\n");
}

export function buildProgramPrompt(opts: {
  scrape: ScrapeResult;
  categories: string[];
  vendors: string[];
  /** Content already in the editor: the AI keeps what is good and fixes duplicates and gaps. */
  current?: PrefillProgram;
}): string {
  const current = opts.current && Object.values(opts.current).some(v => (Array.isArray(v) ? v.length : v));
  return [
    "You are writing a program page for KeyAway. Follow the rules, use only the sources below, and answer with JSON only (no commentary, no code fence).",
    "",
    "# Rules",
    PROGRAM_WRITING_RULES,
    "",
    `Existing categories (pick from these only): ${opts.categories.join(", ") || "none"}`,
    `Existing vendors: ${opts.vendors.join(", ") || "none"}`,
    "",
    "# Output format",
    PROGRAM_RESULT_SHAPE,
    current
      ? `\n# Content already on the page\nKeep what is good, remove duplicated claims, fill gaps and improve wording. Return the full improved result.\n${JSON.stringify(opts.current, null, 1)}`
      : "",
    "",
    "# Sources",
    scrapeToText(opts.scrape)
  ].join("\n");
}

export function buildVendorPrompt(opts: { scrape: ScrapeResult; current?: PrefillVendor }): string {
  return [
    "You are writing a vendor hub page for KeyAway. Follow the rules, use only the sources below, and answer with JSON only (no commentary, no code fence).",
    "",
    "# Rules",
    VENDOR_WRITING_RULES,
    "",
    "# Output format",
    VENDOR_RESULT_SHAPE,
    opts.current ? `\n# Content already on the page\nKeep what is good and improve it.\n${JSON.stringify(opts.current, null, 1)}` : "",
    "",
    "# Sources",
    scrapeToText(opts.scrape, { maxPageText: 4000 })
  ].join("\n");
}

// ---------------------------------------------------------------------------------------------------------
// Scrape -> result without AI
// ---------------------------------------------------------------------------------------------------------

const majorMinor = (v: string) => v.split(".").slice(0, 2).join(".");

/** "https://www.iobit.com/en/x.php" -> "iobit". */
function domainLabel(url: string): string | undefined {
  try {
    const parts = new URL(url).hostname.split(".");
    return parts.length >= 2 ? parts[parts.length - 2] : undefined;
  } catch {
    return undefined;
  }
}

/** Best-effort program fields straight from the scraped pages (no rewriting). */
export function scrapeToProgramPrefill(scrape: ScrapeResult): PrefillProgram {
  const main = scrape.pages[0];
  const kit = scrape.pressKit;
  if (!main) {
    // Only a press kit (a .zip URL was given).
    if (!kit) return {};
    return {
      title: kit.productName?.replace(/\s+\d+(\.\d+)*$/, "") || undefined,
      latestOfficialVersion: kit.version ? majorMinor(kit.version) : undefined,
      downloadLink: kit.downloadUrl,
      description: kit.description?.split(/\n\s*\n/)[0],
      faq: scrape.faqs.length ? scrape.faqs.slice(0, 8).map(f => ({ question: f.question, answer: f.answer })) : undefined,
      imageUrl: kit.images.find(i => i.kind === "boxshot")?.ref,
      versionCheck: scrape.installer ? { source: "installer", installerUrl: scrape.installer.url } : undefined
    };
  }
  const rawName = main.structured.name || main.title.split(/[|:–—]| - /)[0];
  const title = rawName.replace(/\b(free|pro|\d+(\.\d+)*)\b/gi, "").replace(/\s+/g, " ").trim();
  const version =
    scrape.installer?.productVersion || scrape.installer?.fileVersion || scrape.pressKit?.version || main.structured.version || main.versionCandidates[0];
  const sections = scrape.pages
    .flatMap(p => p.sections)
    .filter(s => s.text.length > 40)
    .slice(0, 4);
  const kitBox = scrape.pressKit?.images.find(i => i.kind === "boxshot");
  const image = main.images.find(i => i.kind === "og") ?? main.images.find(i => i.kind === "page");
  return {
    title: title || undefined,
    // Many product pages never name the publisher; the domain ("iobit.com") still matches the vendor.
    vendor: main.structured.publisher || main.siteName || domainLabel(main.url),
    platforms: main.platforms.length ? main.platforms : undefined,
    latestOfficialVersion: version ? majorMinor(version) : undefined,
    downloadLink: main.downloadLinks[0] ?? scrape.pressKit?.downloadUrl,
    description: main.structured.description || main.metaDescription || undefined,
    aboutSections: sections.length
      ? sections.map(s => ({ title: s.heading, description: s.text.split("\n\n").slice(0, 2).join("\n\n"), points: s.bullets.slice(0, 5) }))
      : undefined,
    faq: scrape.faqs.length ? scrape.faqs.slice(0, 8).map(f => ({ question: f.question, answer: f.answer })) : undefined,
    imageUrl: image?.url ?? kitBox?.ref,
    versionCheck: scrape.installer
      ? { source: "installer", installerUrl: scrape.installer.url }
      : version
        ? { source: "page", pageUrl: main.url }
        : undefined
  };
}

export function scrapeToVendorPrefill(scrape: ScrapeResult): PrefillVendor {
  const main = scrape.pages[0];
  if (!main) return {};
  const logo = main.images.find(i => i.kind === "logo") ?? main.images.find(i => i.kind === "og");
  return {
    name: main.siteName || main.structured.publisher || main.title.split(/[|:–—]| - /)[0].trim() || undefined,
    description: main.metaDescription || undefined,
    logoUrl: logo?.url
  };
}

// ---------------------------------------------------------------------------------------------------------
// Parse pasted AI output
// ---------------------------------------------------------------------------------------------------------

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const s = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const strs = (v: unknown): string[] | undefined => {
  const list = Array.isArray(v) ? v.map(s).filter((x): x is string => !!x) : [];
  return list.length ? list : undefined;
};
const objs = (v: unknown): Obj[] => (Array.isArray(v) ? v.filter(isObj) : []);

function parseProgram(p: Obj): PrefillProgram {
  const seo = isObj(p.seo) ? p.seo : {};
  const vc = isObj(p.versionCheck) ? p.versionCheck : null;
  const platforms = strs(p.platforms)?.map(x => x.toLowerCase()).filter((x): x is "windows" | "mac" => x === "windows" || x === "mac");
  const about = objs(p.aboutSections)
    .map(a => ({ title: s(a.title), description: s(a.description) ?? "", points: strs(a.points), imageUrl: s(a.imageUrl) }))
    .filter(a => a.description || a.points?.length);
  const faq = objs(p.faq)
    .map(f => ({ question: s(f.question) ?? "", answer: s(f.answer) ?? "" }))
    .filter(f => f.question && f.answer);
  const freeVsPro = objs(p.freeVsPro)
    .map(r => ({ feature: s(r.feature) ?? "", free: s(r.free), pro: s(r.pro) }))
    .filter(r => r.feature);
  const source = s(vc?.source);
  return {
    title: s(p.title),
    slug: s(p.slug),
    vendor: s(p.vendor),
    categories: strs(p.categories),
    platforms: platforms?.length ? platforms : undefined,
    latestOfficialVersion: s(p.latestOfficialVersion) ? majorMinor(s(p.latestOfficialVersion)!) : undefined,
    downloadLink: s(p.downloadLink),
    description: s(p.description),
    aboutSections: about.length ? about.slice(0, 4) : undefined,
    faq: faq.length ? faq : undefined,
    freeVsPro: freeVsPro.length ? freeVsPro : undefined,
    seo: s(seo.metaTitle) || s(seo.metaDescription) || strs(seo.metaKeywords)
      ? { metaTitle: s(seo.metaTitle), metaDescription: s(seo.metaDescription), metaKeywords: strs(seo.metaKeywords) }
      : undefined,
    aliases: strs(p.aliases),
    imageUrl: s(p.imageUrl),
    versionCheck:
      source === "installer" || source === "page" || source === "winget" || source === "chocolatey" || source === "homebrew"
        ? { source, installerUrl: s(vc?.installerUrl), pageUrl: s(vc?.pageUrl), packageId: s(vc?.packageId) }
        : undefined
  };
}

function parseVendor(v: Obj): PrefillVendor {
  const seo = isObj(v.seo) ? v.seo : {};
  const rows = objs(v.giveawayVsOfficial)
    .map(r => ({ feature: s(r.feature) ?? "", giveaway: s(r.giveaway), officialPro: s(r.officialPro) }))
    .filter(r => r.feature);
  return {
    name: s(v.name),
    slug: s(v.slug),
    description: s(v.description),
    aliases: strs(v.aliases),
    giveawayVsOfficial: rows.length ? rows : undefined,
    seo: s(seo.metaTitle) || s(seo.metaDescription) ? { metaTitle: s(seo.metaTitle), metaDescription: s(seo.metaDescription) } : undefined,
    logoUrl: s(v.logoUrl)
  };
}

/** Accepts the JSON with or without a code fence or chatter around it. */
export function parsePrefillResult(text: string): { ok: true; value: PrefillResult } | { ok: false; error: string } {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return { ok: false, error: "No JSON object found in the pasted text." };
  let data: unknown;
  try {
    data = JSON.parse(text.slice(start, end + 1));
  } catch (err) {
    return { ok: false, error: `The JSON could not be read: ${err instanceof Error ? err.message : "invalid JSON"}` };
  }
  if (!isObj(data)) return { ok: false, error: "Expected a JSON object." };
  if (isObj(data.vendor) || data.kind === "vendor") return { ok: true, value: { kind: "vendor", vendor: parseVendor(isObj(data.vendor) ? data.vendor : data) } };
  return { ok: true, value: { kind: "program", program: parseProgram(isObj(data.program) ? data.program : data) } };
}
