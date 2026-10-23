/**
 * @fileoverview Reads the version straight from a vendor's Windows installer: downloads only the first
 * megabyte (HTTP Range, or cut off mid-stream) and reads the VERSIONINFO strings (ProductVersion /
 * FileVersion) that installers carry near the start of the file. The file's Last-Modified date is the
 * release date. First-party and same-day, unlike package catalogs.
 *
 * Self-contained (no project imports) so `scripts/prefillScrape.mjs` can run it straight from Node.
 */

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

/** Reads version info from an installer URL. Throws on network errors or when the file is not a Windows executable. */
export async function readInstallerInfo(url: string): Promise<InstallerInfo> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Range: `bytes=0-${HEAD_BYTES - 1}` },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000)
  });
  if (!res.ok) throw new Error(`Installer download returned HTTP ${res.status}`);
  const bytes = await readHead(res, HEAD_BYTES);
  if (bytes[0] !== 0x4d || bytes[1] !== 0x5a) throw new Error("The URL does not lead to a Windows installer (.exe)");

  const range = res.headers.get("content-range")?.match(/\/(\d+)$/)?.[1];
  const size = Number(range ?? (res.status === 200 ? res.headers.get("content-length") : "")) || undefined;
  const modified = res.headers.get("last-modified");
  const info: InstallerInfo = {
    url,
    finalUrl: res.url,
    productVersion: normalizeInstallerVersion(versionString(bytes, "ProductVersion")),
    fileVersion: normalizeInstallerVersion(versionString(bytes, "FileVersion")),
    productName: versionString(bytes, "ProductName"),
    fileDescription: versionString(bytes, "FileDescription"),
    companyName: versionString(bytes, "CompanyName"),
    releasedAt: modified && !Number.isNaN(Date.parse(modified)) ? new Date(modified).toISOString() : undefined,
    size
  };
  const label = `${info.productName ?? ""} ${info.fileDescription ?? ""}`;
  if (/online|downloader|web ?installer|bootstrap|stub/i.test(label) || (size && size < MIN_REAL_INSTALLER)) {
    info.warning = `Looks like a small web installer (${size ? `${(size / 1048576).toFixed(1)} MB` : "unknown size"}); its version may not be the program's.`;
  }
  return info;
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
