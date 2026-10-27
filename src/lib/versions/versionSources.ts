/**
 * @fileoverview Looks up a program's newest official version from one configured source
 * (program.versionCheck): Homebrew cask API, winget manifests on GitHub, the Chocolatey feed, or a
 * pattern on the vendor's page. Plain HTTP requests, no AI. Server only.
 */
import * as cheerio from "cheerio";
import { versionCandidates } from "@/src/lib/prefill/scrapePage";
import { compareVersions } from "./compareVersions";
import { installerVersion, readInstallerInfo } from "./installerVersion";

import type { VERSION_SOURCES } from "@/src/lib/admin/programFields";

export type VersionSource = (typeof VERSION_SOURCES)[number];

export interface VersionCheckConfig {
  source?: VersionSource | string | null;
  packageId?: string | null;
  pageUrl?: string | null;
  installerUrl?: string | null;
  pattern?: string | null;
  autoApply?: boolean | null;
}

export type VersionLookup =
  | { ok: true; version: string; url: string; releasedAt?: string; warning?: string }
  | { ok: false; error: string };

const TIMEOUT_MS = 12_000;
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const VERSION_LIKE = /^\d+(?:\.\d+){0,3}$/;

async function get(url: string, headers: Record<string, string> = {}): Promise<Response> {
  return fetch(url, { headers: { "User-Agent": BROWSER_UA, ...headers }, signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
}

function highest(versions: string[]): string | undefined {
  return versions.filter(v => VERSION_LIKE.test(v)).sort((a, b) => compareVersions(b, a))[0];
}

async function fromHomebrew(token: string): Promise<VersionLookup> {
  const url = `https://formulae.brew.sh/api/cask/${encodeURIComponent(token)}.json`;
  const res = await get(url);
  if (res.status === 404) return { ok: false, error: `Homebrew cask "${token}" not found` };
  if (!res.ok) return { ok: false, error: `Homebrew API ${res.status}` };
  const data = (await res.json()) as { version?: string; homepage?: string };
  const version = data.version?.split(",")[0]?.trim();
  return version ? { ok: true, version, url: data.homepage ?? url } : { ok: false, error: "No version in Homebrew response" };
}

/** winget-pkgs layout: manifests/<first letter>/<Publisher>/<Name…>/<version>/ */
async function fromWinget(id: string): Promise<VersionLookup> {
  const parts = id.split(".").filter(Boolean);
  if (parts.length < 2) return { ok: false, error: 'winget ids look like "Publisher.Name"' };
  const path = `manifests/${parts[0][0].toLowerCase()}/${parts.map(encodeURIComponent).join("/")}`;
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await get(`https://api.github.com/repos/microsoft/winget-pkgs/contents/${path}`, headers);
  if (res.status === 404) return { ok: false, error: `winget package "${id}" not found` };
  if (res.status === 403) return { ok: false, error: "GitHub rate limit hit (set GITHUB_TOKEN to raise it)" };
  if (!res.ok) return { ok: false, error: `GitHub API ${res.status}` };
  const entries = (await res.json()) as { name: string; type: string }[];
  const version = highest(entries.filter(e => e.type === "dir").map(e => e.name));
  return version
    ? { ok: true, version, url: `https://github.com/microsoft/winget-pkgs/tree/master/${path}/${version}` }
    : { ok: false, error: "No version folders in the winget manifest" };
}

/** FilePuma asks crawlers for 5 s between requests (robots.txt Crawl-delay); lookups queue behind each other. */
const FILEPUMA_GAP_MS = 5_000;
let filepumaQueue: Promise<unknown> = Promise.resolve();
let filepumaLastAt = 0;

function throttleFilepuma<T>(task: () => Promise<T>): Promise<T> {
  const run = filepumaQueue.then(async () => {
    const wait = filepumaLastAt + FILEPUMA_GAP_MS - Date.now();
    if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
    filepumaLastAt = Date.now();
    return task();
  });
  filepumaQueue = run.catch(() => {});
  return run;
}

const normName = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * FilePuma (GlarySoft's software library) lists programs as "Name 1.2.3" in search results. Its download
 * URLs change with every version, so the search for the exact name is the stable lookup.
 */
async function fromFilepuma(name: string): Promise<VersionLookup> {
  const url = `https://www.filepuma.com/search/${encodeURIComponent(name.trim())}/`;
  const res = await throttleFilepuma(() => get(url, { Accept: "text/html" }));
  if (!res.ok) return { ok: false, error: `FilePuma returned ${res.status}` };
  const $ = cheerio.load(await res.text());
  const listed = $(".categories-app-title")
    .toArray()
    .map(el => {
      const title = $(el).text().replace(/\s+/g, " ").trim();
      const m = /^(.*?)\s+v?(\d+(?:\.\d+)+)\s*$/.exec(title);
      return m ? { name: m[1], version: m[2] } : null;
    })
    .filter((x): x is { name: string; version: string } => !!x);
  const version = highest(listed.filter(l => normName(l.name) === normName(name)).map(l => l.version));
  if (version) return { ok: true, version, url };
  const near = listed.slice(0, 3).map(l => l.name);
  return { ok: false, error: `"${name}" not found on FilePuma${near.length ? ` (results: ${near.join(", ")})` : ""}` };
}

async function fromChocolatey(id: string): Promise<VersionLookup> {
  const url = `https://community.chocolatey.org/api/v2/FindPackagesById()?id='${encodeURIComponent(id)}'&$filter=IsLatestVersion`;
  const res = await get(url);
  if (!res.ok) return { ok: false, error: `Chocolatey API ${res.status}` };
  const xml = await res.text();
  const versions = [...xml.matchAll(/<d:Version>([^<]+)<\/d:Version>/g)].map(m => m[1].trim());
  const version = highest(versions);
  return version
    ? { ok: true, version, url: `https://community.chocolatey.org/packages/${encodeURIComponent(id)}` }
    : { ok: false, error: `Chocolatey package "${id}" not found` };
}

export function findVersionInText(text: string, pattern?: string | null): string | undefined {
  return versionCandidates(text, pattern)[0];
}

async function fromInstaller(url: string): Promise<VersionLookup> {
  const info = await readInstallerInfo(url);
  const version = installerVersion(info);
  if (!version) return { ok: false, error: "The installer has no version information" };
  return { ok: true, version, url: info.finalUrl, releasedAt: info.releasedAt, warning: info.warning };
}

async function fromPage(pageUrl: string, pattern?: string | null): Promise<VersionLookup> {
  if (pattern) {
    try {
      new RegExp(pattern);
    } catch {
      return { ok: false, error: "The version pattern is not a valid regular expression" };
    }
  }
  const res = await get(pageUrl, { Accept: "text/html" });
  if (!res.ok) return { ok: false, error: `Page returned ${res.status}` };
  const $ = cheerio.load(await res.text());
  $("script, style, noscript, svg").remove();
  const text = `${$("title").text()} ${$("meta[name='description']").attr("content") ?? ""} ${$("body").text()}`.replace(/\s+/g, " ");
  const version = findVersionInText(text, pattern);
  return version ? { ok: true, version, url: pageUrl } : { ok: false, error: "No version found on the page" };
}

/** Versions are tracked as major.minor: "14.0.1.462" -> "14.0". */
export function trimVersion(version: string): string {
  return version.split(".").slice(0, 2).join(".");
}

/** Runs the configured lookup; the found version is trimmed to major.minor. Never throws. */
export async function lookupLatestVersion(config: VersionCheckConfig | null | undefined): Promise<VersionLookup> {
  const result = await lookupRaw(config);
  return result.ok ? { ...result, version: trimVersion(result.version) } : result;
}

async function lookupRaw(config: VersionCheckConfig | null | undefined): Promise<VersionLookup> {
  const source = config?.source;
  const id = config?.packageId?.trim();
  try {
    switch (source) {
      case "installer":
        return config?.installerUrl?.trim() ? await fromInstaller(config.installerUrl.trim()) : { ok: false, error: "Set the installer URL" };
      case "homebrew":
        return id ? await fromHomebrew(id) : { ok: false, error: "Set the Homebrew cask token" };
      case "winget":
        return id ? await fromWinget(id) : { ok: false, error: "Set the winget package id" };
      case "chocolatey":
        return id ? await fromChocolatey(id) : { ok: false, error: "Set the Chocolatey package id" };
      case "filepuma":
        return id ? await fromFilepuma(id) : { ok: false, error: "Set the program name as FilePuma lists it" };
      case "page":
        return config?.pageUrl?.trim() ? await fromPage(config.pageUrl.trim(), config.pattern) : { ok: false, error: "Set the page URL" };
      default:
        return { ok: false, error: "No version source configured" };
    }
  } catch (err) {
    const timeout = err instanceof Error && err.name === "TimeoutError";
    return { ok: false, error: timeout ? "Request timed out" : err instanceof Error ? err.message : "Lookup failed" };
  }
}
