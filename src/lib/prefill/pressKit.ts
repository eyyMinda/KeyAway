/**
 * @fileoverview Vendor press kits for prefill: finds the kit for a product (IObit press room, a press page
 * URL, or a direct .zip URL), unzips it in memory and reads the product information, what's new, FAQ and
 * press release documents (.txt / .docx) plus screenshots, box shots and logos.
 *
 * Self-contained (only `cheerio` and Node built-ins) so `scripts/prefillScrape.mjs` can run it from Node.
 */
import { inflateRawSync } from "node:zlib";
import * as cheerio from "cheerio";

export interface PressKitImage {
  /** `presskit:<zip url>#<path in zip>`; the admin image import understands it. */
  ref: string;
  name: string;
  kind: "screenshot" | "boxshot" | "logo" | "image";
  /** data: URL for previews (screenshots/logos only, size-capped). */
  preview?: string;
}

export interface PressKit {
  url: string;
  productName?: string;
  version?: string;
  releaseDate?: string;
  worksIn?: string;
  downloadUrl?: string;
  whatsNew: string[];
  description?: string;
  pressRelease?: string;
  faqs: { question: string; answer: string }[];
  images: PressKitImage[];
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const MAX_ZIP_BYTES = 40 * 1024 * 1024;
const MAX_PREVIEW_BYTES = 6 * 1024 * 1024;
const clean = (s: string) => s.replace(/\s+/g, " ").trim();

// ---------------------------------------------------------------------------------------------------------
// Minimal zip reader (stored + deflate entries)
// ---------------------------------------------------------------------------------------------------------

export function unzip(buf: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a zip file");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count && buf.readUInt32LE(p) === 0x02014b50; n++) {
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const flags = buf.readUInt16LE(p + 8);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString(flags & 0x800 ? "utf8" : "latin1");
    p += 46 + nameLen + extraLen + commentLen;
    if (name.endsWith("/")) continue;
    const dataStart = localOffset + 30 + buf.readUInt16LE(localOffset + 26) + buf.readUInt16LE(localOffset + 28);
    const data = buf.subarray(dataStart, dataStart + compSize);
    if (method === 0) files.set(name, Buffer.from(data));
    else if (method === 8) files.set(name, inflateRawSync(data));
  }
  return files;
}

function docxText(buf: Buffer): string {
  const xml = unzip(buf).get("word/document.xml")?.toString("utf8") ?? "";
  return xml
    .replace(/<w:instrText[^>]*>[\s\S]*?<\/w:instrText>/g, "") // HYPERLINK field codes
    .replace(/<w:tab\/>/g, " ")
    .replace(/<w:br\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ---------------------------------------------------------------------------------------------------------
// Parsing the kit
// ---------------------------------------------------------------------------------------------------------

/** "Q: … A: …" blocks (the format IObit and most press kits use). */
function parseFaq(text: string): { question: string; answer: string }[] {
  const out: { question: string; answer: string }[] = [];
  const re = /(?:^|\n)\s*Q\s*[:：.]\s*([\s\S]+?)\n\s*A\s*[:：.]\s*([\s\S]+?)(?=\n\s*Q\s*[:：.]|$)/g;
  for (const m of text.matchAll(re)) {
    const question = clean(m[1]);
    const answer = m[2].trim().replace(/\n{2,}/g, "\n\n");
    if (question && answer) out.push({ question, answer });
  }
  return out;
}

/** "Label:\nvalue" / "Label: value" fields and the What's new / Description blocks of a product info file. */
function parseProductInfo(text: string, kit: PressKit) {
  const field = (label: string) => text.match(new RegExp(`${label}\\s*[:：]\\s*\\n?\\s*([^\\n]+)`, "i"))?.[1]?.trim();
  kit.productName ??= field("Product Name");
  kit.version ??= field("Version")?.match(/\d+(?:\.\d+){0,3}/)?.[0];
  kit.releaseDate ??= field("Release Date");
  kit.worksIn ??= field("Works in") ?? field("System Requirements?");
  kit.downloadUrl ??= field("Download URL")?.match(/https?:\/\/\S+/)?.[0];
  const whatsNew = text.match(/What'?s new\s*[:：]?\s*\n([\s\S]*?)(?:\n\s*\n\s*[A-Z][\w ]+\s*[:：]|\n\s*Description\s*[:：]|$)/i)?.[1];
  if (whatsNew && !kit.whatsNew.length) {
    kit.whatsNew = whatsNew
      .split("\n")
      .map(l => l.replace(/^\s*[+\-*•]\s*/, "").trim())
      .filter(Boolean);
  }
  const description = text.match(/Description\s*[:：]\s*\n([\s\S]+)/i)?.[1]?.trim();
  if (description && !kit.description) kit.description = description;
}

function imageKind(path: string): PressKitImage["kind"] {
  const p = path.toLowerCase();
  if (/screenshot|screen ?shot/.test(p)) return "screenshot";
  if (/box ?shot|boxshot/.test(p)) return "boxshot";
  if (/logo|icon/.test(p)) return "logo";
  return "image";
}

const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" };

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Press kit download returned HTTP ${res.status}`);
  const size = Number(res.headers.get("content-length") ?? 0);
  if (size > MAX_ZIP_BYTES) throw new Error("Press kit is larger than 40 MB");
  return Buffer.from(await res.arrayBuffer());
}

export async function readPressKit(zipUrl: string): Promise<PressKit> {
  const files = unzip(await download(zipUrl));
  const kit: PressKit = { url: zipUrl, whatsNew: [], faqs: [], images: [] };
  let previewBytes = 0;
  const sorted = [...files.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  for (const path of sorted) {
    const buf = files.get(path)!;
    const lower = path.toLowerCase();
    const ext = lower.split(".").pop() ?? "";
    const isText = ext === "txt" || ext === "md";
    const text = isText ? buf.toString("utf8").replace(/^﻿/, "").replace(/\r\n?/g, "\n") : ext === "docx" ? docxText(buf) : null;

    if (text !== null) {
      if (/faq/.test(lower)) kit.faqs.push(...parseFaq(text));
      else if (/press ?release|announcement|news/.test(lower)) kit.pressRelease ??= text.slice(0, 8000);
      else if (/info|product|readme|fact/.test(lower)) parseProductInfo(text, kit);
    } else if (MIME[ext]) {
      const kind = imageKind(path);
      const name = path.split("/").pop()!.replace(/\.[^.]+$/, "");
      const withPreview = kind !== "image" && previewBytes + buf.length <= MAX_PREVIEW_BYTES;
      if (withPreview) previewBytes += buf.length;
      kit.images.push({
        ref: `presskit:${zipUrl}#${path}`,
        name,
        kind,
        ...(withPreview ? { preview: `data:${MIME[ext]};base64,${buf.toString("base64")}` } : {})
      });
    }
  }
  return kit;
}

/** One image from a kit, for the admin image import (`presskit:<zip url>#<path>`). */
export async function readPressKitImage(ref: string): Promise<{ data: Buffer; mime: string; name: string } | null> {
  const m = /^presskit:(https?:\/\/[^#]+)#(.+)$/.exec(ref);
  if (!m) return null;
  const data = unzip(await download(m[1])).get(m[2]);
  const ext = m[2].toLowerCase().split(".").pop() ?? "";
  return data && MIME[ext] ? { data, mime: MIME[ext], name: m[2].split("/").pop()! } : null;
}

// ---------------------------------------------------------------------------------------------------------
// Finding the kit
// ---------------------------------------------------------------------------------------------------------

const productKey = (name: string) =>
  name
    .toLowerCase()
    .replace(/\b(iobit|itop|aomei|softorbits|free|pro|for windows|for mac)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Press pages that list kits per product, by vendor domain. */
const PRESS_PAGES: { host: RegExp; url: string }[] = [{ host: /(^|\.)iobit\.com$/i, url: "https://www.iobit.com/en/pressroom.php" }];

/** Kit zip links on a press page, each with the product heading closest to it. */
async function kitsOnPage(pageUrl: string): Promise<{ url: string; product: string }[]> {
  const res = await fetch(pageUrl, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) return [];
  const $ = cheerio.load(await res.text());
  return $("a[href$='.zip'], a[href*='.zip?']")
    .toArray()
    .map(a => {
      const href = new URL($(a).attr("href")!, pageUrl).toString();
      const product = clean($(a).closest("li, article, section, div").find("h2, h3, h4, h5, strong").first().text());
      return { url: href, product };
    });
}

/**
 * The press kit for a product: a .zip URL given directly, a kit on a press page given in `urls`, or a kit
 * on the vendor's known press page (IObit). Null when there is none.
 */
export async function findPressKit(urls: string[], productName: string): Promise<string | null> {
  const direct = urls.find(u => /\.zip(\?|$)/i.test(u));
  if (direct) return direct;
  const pages = new Set(urls.filter(u => /press|media|newsroom/i.test(u)));
  for (const u of urls) {
    try {
      const host = new URL(u).hostname;
      PRESS_PAGES.filter(p => p.host.test(host)).forEach(p => pages.add(p.url));
    } catch {
      /* not a URL */
    }
  }
  const key = productKey(productName);
  if (!key) return null;
  for (const page of pages) {
    const kits = await kitsOnPage(page).catch(() => []);
    // Exact product first ("Advanced SystemCare" must not take the "Advanced SystemCare Ultimate" kit);
    // otherwise the longest product name the given name starts with ("Driver Booster 14 Pro" -> "Driver Booster").
    const exact = kits.filter(k => productKey(k.product) === key);
    const prefix = kits
      .filter(k => productKey(k.product) && key.startsWith(productKey(k.product)))
      .sort((a, b) => productKey(b.product).length - productKey(a.product).length);
    const product = exact.length ? exact : prefix.filter(k => productKey(k.product) === productKey(prefix[0]?.product ?? ""));
    // A product can have kits for several versions: take the highest version in the file name.
    const best = product.sort((a, b) => kitVersion(b.url) - kitVersion(a.url))[0];
    if (best) return best.url;
  }
  return null;
}

const kitVersion = (url: string) => Number(url.match(/_v(\d+)/i)?.[1] ?? 0);
