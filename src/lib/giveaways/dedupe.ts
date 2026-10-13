import crypto from "crypto";
import { normalizeKey } from "@/src/lib/keyHashing";
import type {
  ExtractedAccount,
  ExtractedLink,
  GiveawayFindAccount,
  GiveawayFindKey,
  GiveawayFindLink,
  GiveawayIgnoredItemKind,
  GiveawayIgnoreReason
} from "@/src/types/giveaways";
import { GIVEAWAY_FIND_ID_PREFIX } from "./constants";
import { normalizeUrl, type DiscoveryProgram } from "./matchProgram";

/** Key identity for duplicate checks: `normalizeKey` plus no separators, so "ABCD-1234" equals "abcd 1234". */
export function keyIdentity(value: string): string {
  return normalizeKey(value).replace(/[-–—_.]/g, "");
}

/** Identity used by the ignore list: `k:<key identity>`, `a:<lowercase username>` or `l:<normalized URL>`. */
export function ignoredIdentity(kind: GiveawayIgnoredItemKind, value: string): string {
  if (kind === "key") return `k:${keyIdentity(value)}`;
  if (kind === "link") return `l:${normalizeUrl(value)}`;
  return `a:${value.trim().toLowerCase()}`;
}

/** Ignore list by identity → reason (see `loadIgnoredItems`). */
export type IgnoredItems = Map<string, GiveawayIgnoreReason>;

/** Values already on a program, normalized the same way as `getKeyData` (any status, including expired). */
export interface ExistingEntries {
  keys: Set<string>;
  usernames: Set<string>;
  links: Set<string>;
}

export function existingEntriesOf(program: Pick<DiscoveryProgram, "cdKeys">): ExistingEntries {
  const out: ExistingEntries = { keys: new Set(), usernames: new Set(), links: new Set() };
  for (const entry of program.cdKeys ?? []) {
    if (entry?.key?.trim()) out.keys.add(keyIdentity(entry.key));
    if (entry?.username?.trim()) out.usernames.add(entry.username.trim().toLowerCase());
    for (const link of entry?.giveawayLinks ?? []) {
      if (link?.url?.trim()) out.links.add(normalizeUrl(link.url));
    }
  }
  return out;
}

type Items = { keys: string[] | GiveawayFindKey[]; accounts: ExtractedAccount[]; links: ExtractedLink[] };

export interface FlaggedItems {
  keys: GiveawayFindKey[];
  accounts: GiveawayFindAccount[];
  links: GiveawayFindLink[];
}

function keyValue(k: string | GiveawayFindKey): string {
  return typeof k === "string" ? k : k.value;
}

/**
 * Marks each item `isNew` unless it is already on any of the given programs.
 * Keys/accounts on the ignore list are never new and carry their `ignoredReason`.
 */
export function flagItems(items: Items, against: ExistingEntries[], ignored: IgnoredItems = new Map()): FlaggedItems {
  const known = (pick: (e: ExistingEntries) => Set<string>, value: string) => against.some(e => pick(e).has(value));
  return {
    keys: items.keys.map(k => {
      const value = keyValue(k);
      const ignoredReason = ignored.get(ignoredIdentity("key", value));
      if (ignoredReason) return { value, isNew: false, ignoredReason };
      return { value, isNew: !known(e => e.keys, keyIdentity(value)) };
    }),
    accounts: items.accounts.map(a => {
      const ignoredReason = ignored.get(ignoredIdentity("account", a.username));
      return {
        username: a.username,
        ...(a.password && { password: a.password }),
        isNew: ignoredReason ? false : !known(e => e.usernames, a.username.trim().toLowerCase()),
        ...(ignoredReason && { ignoredReason })
      };
    }),
    links: items.links.map(l => {
      const ignoredReason = ignored.get(ignoredIdentity("link", l.url));
      return {
        url: l.url,
        ...(l.label && { label: l.label }),
        isNew: ignoredReason ? false : !known(e => e.links, normalizeUrl(l.url)),
        ...(ignoredReason && { ignoredReason })
      };
    })
  };
}

export function countItems(items: FlaggedItems): { total: number; fresh: number } {
  const all = [...items.keys, ...items.accounts, ...items.links];
  return { total: all.length, fresh: all.filter(i => i.isNew).length };
}

/**
 * Keys/accounts decide whether a find is worth reporting. Links alone (e.g. the vendor's giveaway page)
 * are context, so a page whose only "new" thing is a link still counts as new when nothing else was found.
 */
export function hasNewActivation(items: FlaggedItems): boolean {
  return items.keys.some(k => k.isNew) || items.accounts.some(a => a.isNew);
}

/**
 * Whether a find has anything worth reviewing. Keys/accounts decide when there are any; otherwise
 * (link-based giveaways) a new giveaway link counts. Nothing extracted at all is still worth a look,
 * since the page itself is the lead. Ignored items (limit/invalid/expired) never count.
 */
export function hasSomethingNew(items: FlaggedItems): boolean {
  if (items.keys.length || items.accounts.length) return hasNewActivation(items);
  if (items.links.length) return items.links.some(l => l.isNew);
  return true;
}

/** Union of old and new items (old first), keyed by normalized value. */
export function mergeItems(previous: Partial<FlaggedItems>, next: FlaggedItems): Items {
  const keys = new Map<string, string>();
  for (const k of [...(previous.keys ?? []), ...next.keys]) {
    const norm = keyIdentity(k.value);
    if (!keys.has(norm)) keys.set(norm, k.value);
  }
  const accounts = new Map<string, ExtractedAccount>();
  for (const a of [...(previous.accounts ?? []), ...next.accounts]) {
    const norm = a.username.trim().toLowerCase();
    accounts.set(norm, { username: a.username, password: a.password ?? accounts.get(norm)?.password });
  }
  const links = new Map<string, ExtractedLink>();
  for (const l of [...(previous.links ?? []), ...next.links]) {
    const norm = normalizeUrl(l.url);
    if (!links.has(norm)) links.set(norm, { url: l.url, label: l.label });
  }
  return { keys: [...keys.values()], accounts: [...accounts.values()], links: [...links.values()] };
}

/** Normalized values present in `next` but not in `previous` (used to decide if a known find changed). */
export function addedValues(previous: Partial<FlaggedItems>, next: FlaggedItems): string[] {
  const before = new Set([
    ...(previous.keys ?? []).map(k => ignoredIdentity("key", k.value)),
    ...(previous.accounts ?? []).map(a => ignoredIdentity("account", a.username)),
    ...(previous.links ?? []).map(l => ignoredIdentity("link", l.url))
  ]);
  return [
    ...next.keys.filter(k => k.isNew).map(k => ignoredIdentity("key", k.value)),
    ...next.accounts.filter(a => a.isNew).map(a => ignoredIdentity("account", a.username)),
    // A new giveaway link only matters for link-based finds (no keys/accounts on the page).
    ...(next.keys.length || next.accounts.length ? [] : next.links.filter(l => l.isNew).map(l => ignoredIdentity("link", l.url)))
  ].filter(v => !before.has(v));
}

/** Deterministic Sanity id so re-runs update the same document. The dotted prefix keeps it private. */
export function giveawayFindId(sourceUrl: string): string {
  return `${GIVEAWAY_FIND_ID_PREFIX}${crypto.createHash("sha256").update(normalizeUrl(sourceUrl)).digest("hex").slice(0, 24)}`;
}

/** Sanity array members need stable `_key`s. */
export function withKeys<T extends object>(items: T[], prefix: string): (T & { _key: string })[] {
  return items.map((item, i) => ({ ...item, _key: `${prefix}${i}` }));
}
