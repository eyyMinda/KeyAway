import { DEFAULT_SITE_URL } from "@/src/lib/seo/storeSeoResolve";

const USER_AGENT = `Mozilla/5.0 (compatible; KeyAwayBot/1.0; +${DEFAULT_SITE_URL}/contact)`;
const TIMEOUT_MS = 15_000;
const MAX_BYTES = 1_500_000;

export type FetchResult =
  | { ok: true; status: number; text: string; /** URL after redirects. */ finalUrl: string }
  | { ok: false; status: number; error: string };

/** Reads at most MAX_BYTES of the body so one huge page can't blow up memory or CPU. */
async function readCapped(res: Response): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  await reader.cancel().catch(() => {});
  const buf = new Uint8Array(Math.min(total, MAX_BYTES));
  let offset = 0;
  for (const c of chunks) {
    const slice = c.subarray(0, Math.max(0, buf.length - offset));
    buf.set(slice, offset);
    offset += slice.length;
    if (offset >= buf.length) break;
  }
  return new TextDecoder("utf-8").decode(buf);
}

/** GET with a bot user agent, timeout, and size cap. Never throws. */
export async function politeFetch(url: string, accept = "text/html,application/xhtml+xml"): Promise<FetchResult> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: accept },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (!res.ok) {
      await res.body?.cancel().catch(() => {});
      return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    }
    return { ok: true, status: res.status, text: await readCapped(res), finalUrl: res.url || url };
  } catch (err) {
    const message = err instanceof Error ? err.message : "fetch failed";
    return { ok: false, status: 0, error: message };
  }
}

type RobotsRule = { allow: boolean; pattern: string };

/** Disallow/Allow rules for `User-agent: *` (or a KeyAwayBot group when one exists). */
function parseRobots(text: string): RobotsRule[] {
  const groups: { agents: string[]; rules: RobotsRule[] }[] = [];
  let current: { agents: string[]; rules: RobotsRule[] } | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const field = m[1].toLowerCase();
    const value = m[2].trim();
    if (field === "user-agent") {
      if (!current || current.rules.length > 0) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if ((field === "disallow" || field === "allow") && current) {
      if (value) current.rules.push({ allow: field === "allow", pattern: value });
    }
  }
  const own = groups.find(g => g.agents.some(a => a.includes("keyawaybot")));
  return (own ?? groups.find(g => g.agents.includes("*")))?.rules ?? [];
}

function ruleMatches(pattern: string, path: string): boolean {
  const anchored = pattern.endsWith("$");
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const regex = new RegExp(
    "^" + body.split("*").map(part => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + (anchored ? "$" : "")
  );
  return regex.test(path);
}

/**
 * Per-run robots.txt cache. Longest matching rule wins (Allow beats Disallow on ties).
 * A missing or unreadable robots.txt allows everything.
 */
export function createRobotsChecker() {
  const cache = new Map<string, Promise<RobotsRule[]>>();
  return async function isAllowed(url: string): Promise<boolean> {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return false;
    }
    const origin = parsed.origin;
    if (!cache.has(origin)) {
      cache.set(
        origin,
        politeFetch(`${origin}/robots.txt`, "text/plain").then(r => (r.ok ? parseRobots(r.text) : []))
      );
    }
    const rules = await cache.get(origin)!;
    const path = parsed.pathname + parsed.search;
    let best: RobotsRule | null = null;
    for (const rule of rules) {
      if (!ruleMatches(rule.pattern, path)) continue;
      if (!best || rule.pattern.length > best.pattern.length || (rule.pattern.length === best.pattern.length && rule.allow)) {
        best = rule;
      }
    }
    return best ? best.allow : true;
  };
}
