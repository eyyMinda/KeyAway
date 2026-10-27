/**
 * @fileoverview Reads the version straight from a vendor's Windows installer: downloads only the first
 * megabyte (HTTP Range, or cut off mid-stream) and reads the VERSIONINFO strings (ProductVersion /
 * FileVersion) that installers carry near the start of the file. The file's Last-Modified date is the
 * release date. First-party and same-day, unlike package catalogs.
 *
 * Also reads Mac `.pkg` installers (the version in the package's Distribution file, near the start) and
 * `.zip` downloads that wrap a Windows installer (the whole zip is downloaded, up to 40 MB).
 *
 * Only Node built-ins and explicit `.ts` imports, so `scripts/prefillScrape.mjs` can run it straight from Node.
 */
import { unzipSync } from "node:zlib";
import { unzip } from "../zip/unzip.ts";

export interface InstallerInfo {
  url: string;
  /** Final URL after redirects. */
  finalUrl: string;
  productVersion?: string;
  fileVersion?: string;
  productName?: string;
  fileDescription?: string;
  companyName?: string;
  /** Installer Last-Modified header (ISO). */
  releasedAt?: string;
  /** Full file size in bytes when the server reports it. */
  size?: number;
  /** Set when this looks like a small web installer whose version is not the program's. */
  warning?: string;
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const HEAD_BYTES = 1024 * 1024;
const MAX_ZIP_BYTES = 40 * 1024 * 1024;
const MIN_REAL_INSTALLER = 2.5 * 1024 * 1024;

/** First `limit` bytes of a response body, cancelling the rest (for servers that ignore Range). */
async function readHead(res: Response, limit: number): Promise<Uint8Array> {
  const reader = res.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < limit) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    total += value.length;
  }
  await reader.cancel().catch(() => {});
  const out = new Uint8Array(Math.min(total, limit));
  let offset = 0;
  for (const c of chunks) {
    const take = Math.min(c.length, out.length - offset);
    out.set(c.subarray(0, take), offset);
    offset += take;
    if (offset >= out.length) break;
  }
  return out;
}

/**
 * UTF-16LE VERSIONINFO string value after `key` (e.g. "ProductVersion"), or undefined. Only real `String`
 * entries count: the 6 bytes before the key are its header (wLength, wValueLength > 0, wType = 1 for text),
 * so the same words elsewhere in the file (manifests, name tables) are skipped.
 */
function versionString(bytes: Uint8Array, key: string): string | undefined {
  const needle: number[] = [];
  for (const ch of `${key}\0`) needle.push(ch.charCodeAt(0), 0);
  const u16 = (at: number) => bytes[at] | (bytes[at + 1] << 8);
  outer: for (let i = 6; i <= bytes.length - needle.length; i++) {
    for (let k = 0; k < needle.length; k++) if (bytes[i + k] !== needle[k]) continue outer;
    if (u16(i - 2) !== 1 || u16(i - 4) === 0) continue;
    let j = i + needle.length;
    while (j < bytes.length - 1 && bytes[j] === 0 && bytes[j + 1] === 0) j += 2; // padding
    let value = "";
    for (; j < bytes.length - 1; j += 2) {
      const code = bytes[j] | (bytes[j + 1] << 8);
      if (!code) break;
      value += String.fromCharCode(code);
    }
    return value.trim() || undefined;
  }
  return undefined;
}

/** "14.0.1.462" from "14, 0, 1, 462" / "v14.0.1" / "14.0.1.462 (build)". */
export function normalizeInstallerVersion(raw?: string): string | undefined {
  const m = raw?.replace(/,\s*/g, ".").match(/\d+(?:\.\d+){0,3}/);
  return m?.[0];
}

/** VERSIONINFO strings of a Windows executable. */
function exeVersionInfo(bytes: Uint8Array) {
  return {
    productVersion: normalizeInstallerVersion(versionString(bytes, "ProductVersion")),
    fileVersion: normalizeInstallerVersion(versionString(bytes, "FileVersion")),
    productName: versionString(bytes, "ProductName"),
    fileDescription: versionString(bytes, "FileDescription"),
    companyName: versionString(bytes, "CompanyName")
  };
}

const isExe = (b: Uint8Array) => b[0] === 0x4d && b[1] === 0x5a; // MZ
const isZip = (b: Uint8Array) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04; // PK\3\4
const isXar = (b: Uint8Array) => b[0] === 0x78 && b[1] === 0x61 && b[2] === 0x72 && b[3] === 0x21; // xar!

/**
 * Mac `.pkg` (xar archive): header, zlib-compressed XML table of contents, then the file heap. The small
 * Distribution file near the start of the heap names the app version (`pkg-ref version` or
 * `CFBundleShortVersionString`).
 */
function pkgVersionInfo(bytes: Uint8Array): { productVersion?: string; productName?: string } {
  const buf = Buffer.from(bytes);
  const headerSize = buf.readUInt16BE(4);
  const tocLength = Number(buf.readBigUInt64BE(8));
  if (headerSize + tocLength > buf.length) return {};
  const toc = unzipSync(buf.subarray(headerSize, headerSize + tocLength)).toString("utf8");
  const heap = headerSize + tocLength;
  for (const m of toc.matchAll(/<file id="\d+">([\s\S]*?)<\/file>/g)) {
    const body = m[1];
    if (!/<name>Distribution<\/name>/.test(body)) continue;
    const offset = Number(/<offset>(\d+)<\/offset>/.exec(body)?.[1]);
    const length = Number(/<length>(\d+)<\/length>/.exec(body)?.[1]);
    const start = heap + offset;
    if (!Number.isFinite(offset) || !Number.isFinite(length) || start + length > buf.length) return {};
    let data = buf.subarray(start, start + length);
    if (/<encoding style="[^"]*(gzip|zlib)/.test(body)) data = unzipSync(data);
    const xml = data.toString("utf8");
    const version =
      /CFBundleShortVersionString="([^"]+)"/.exec(xml)?.[1] ??
      [...xml.matchAll(/<pkg-ref[^>]*\bversion="([^"]+)"/g)].map(v => v[1]).find(v => v !== "1.0") ??
      /<pkg-ref[^>]*\bversion="([^"]+)"/.exec(xml)?.[1];
    const title = /<title>([^<]+)<\/title>/.exec(xml)?.[1];
    return { productVersion: normalizeInstallerVersion(version), productName: title && !/^[A-Z_]+$/.test(title) ? title : undefined };
  }
  return {};
}

function finish(info: InstallerInfo): InstallerInfo {
  const label = `${info.productName ?? ""} ${info.fileDescription ?? ""}`;
  if (/online|downloader|web ?installer|bootstrap|stub/i.test(label) || (info.size && info.size < MIN_REAL_INSTALLER)) {
    info.warning = `Looks like a small web installer (${info.size ? `${(info.size / 1048576).toFixed(1)} MB` : "unknown size"}); its version may not be the program's.`;
  }
  return info;
}

/**
 * Reads version info from an installer URL: a Windows .exe, a Mac .pkg, or a .zip wrapping an .exe.
 * Throws on network errors or unsupported files.
 */
export async function readInstallerInfo(url: string): Promise<InstallerInfo> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Range: `bytes=0-${HEAD_BYTES - 1}` },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000)
  });
  if (!res.ok) throw new Error(`Installer download returned HTTP ${res.status}`);
  const bytes = await readHead(res, HEAD_BYTES);

  const range = res.headers.get("content-range")?.match(/\/(\d+)$/)?.[1];
  const size = Number(range ?? (res.status === 200 ? res.headers.get("content-length") : "")) || undefined;
  const modified = res.headers.get("last-modified");
  const base = {
    url,
    finalUrl: res.url,
    releasedAt: modified && !Number.isNaN(Date.parse(modified)) ? new Date(modified).toISOString() : undefined,
    size
  };

  if (isExe(bytes)) return finish({ ...base, ...exeVersionInfo(bytes) });
  if (isXar(bytes)) return { ...base, ...pkgVersionInfo(bytes) };
  if (isZip(bytes)) {
    if (size && size > MAX_ZIP_BYTES) throw new Error("The zip is larger than 40 MB");
    const full = await fetch(res.url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(60_000) });
    if (!full.ok) throw new Error(`Installer download returned HTTP ${full.status}`);
    const zipBytes = Buffer.from(await full.arrayBuffer());
    if (zipBytes.length > MAX_ZIP_BYTES) throw new Error("The zip is larger than 40 MB");
    // The largest .exe in the zip is the installer.
    const exe = [...unzip(zipBytes).entries()]
      .filter(([name, data]) => name.toLowerCase().endsWith(".exe") && isExe(data))
      .sort((x, y) => y[1].length - x[1].length)[0];
    if (!exe) throw new Error("The zip does not contain a Windows installer (.exe)");
    return finish({ ...base, size: exe[1].length, ...exeVersionInfo(exe[1]) });
  }
  throw new Error("The URL does not lead to an installer (.exe, .pkg or a zip with an .exe)");
}

/** The program version an installer reports: ProductVersion, else FileVersion. */
export function installerVersion(info: InstallerInfo): string | undefined {
  return info.productVersion || info.fileVersion;
}

/** Tries download links in order and returns the first real Windows installer with a version. */
export async function findInstaller(urls: string[], max = 4): Promise<InstallerInfo | null> {
  for (const url of urls.slice(0, max)) {
    try {
      const info = await readInstallerInfo(url);
      if (installerVersion(info) && !info.warning) return info;
    } catch {
      /* not an installer: try the next link */
    }
  }
  return null;
}
