import crypto from "crypto";
import { mutationClient } from "@/src/lib/sanity/mutationClient";
import { GIVEAWAY_WATCH_STATE_ID } from "./constants";
import { politeFetch } from "./politeFetch";

/**
 * Per watch page: where its WordPress REST entry lives and the `modified` time seen last run.
 * Lets a run ask each site once which watch pages changed, instead of opening every page daily.
 */
export interface WatchStateEntry {
  /** Normalized watch URL. */
  url: string;
  /** REST collection, e.g. https://site/wp-json/wp/v2/posts */
  api?: string;
  postId?: number;
  modified?: string;
  checkedAt?: string;
  /** Last successful fetch. */
  lastOkAt?: string;
  /** Last fetch error (HTTP status / timeout), cleared on success. */
  lastError?: string;
  /** Consecutive failed fetches. */
  errorCount?: number;
}

export type WatchState = Map<string, WatchStateEntry>;

export async function loadWatchState(): Promise<WatchState> {
  const rows = await mutationClient.fetch<WatchStateEntry[] | null>(
    `*[_id == $id][0].entries[]{url, api, postId, modified, checkedAt, lastOkAt, lastError, errorCount}`,
    { id: GIVEAWAY_WATCH_STATE_ID }
  );
  return new Map((rows ?? []).filter(r => r?.url).map(r => [r.url, r]));
}

const ALTERNATE_JSON = /<link\b[^>]*\bhref=["'](https?:\/\/[^"']+\/wp-json\/wp\/v2\/[a-z0-9_-]+)\/(\d+)["'][^>]*>/i;

/** WordPress pages link to their own REST entry (`<link rel="alternate" type="application/json" …>`). */
export function wpApiRefFromHtml(html: string): { api: string; postId: number } | null {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    if (!/alternate/i.test(tag) || !/application\/json/i.test(tag)) continue;
    const m = tag.match(ALTERNATE_JSON);
    if (m) return { api: m[1], postId: Number(m[2]) };
  }
  return null;
}

/** `modified_gmt` per post id for one REST collection, or null when the lookup fails. */
export async function fetchModified(api: string, ids: number[]): Promise<Map<number, string> | null> {
  const out = new Map<number, string>();
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const params = new URLSearchParams({ include: chunk.join(","), per_page: String(chunk.length), _fields: "id,modified_gmt" });
    const res = await politeFetch(`${api}?${params}`, "application/json");
    if (!res.ok) return null;
    try {
      const rows = JSON.parse(res.text) as { id?: number; modified_gmt?: string }[];
      if (!Array.isArray(rows)) return null;
      for (const row of rows) if (row.id && row.modified_gmt) out.set(row.id, row.modified_gmt);
    } catch {
      return null;
    }
  }
  return out;
}

/** Sanity array rows for the private state document (stable `_key` per URL). */
export function watchStateRows(state: WatchState, keepUrls: Set<string>) {
  return [...state.values()]
    .filter(e => keepUrls.has(e.url))
    .map(e => ({ _key: crypto.createHash("sha1").update(e.url).digest("hex").slice(0, 12), ...e }));
}

