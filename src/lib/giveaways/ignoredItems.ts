import { mutationClient } from "@/src/lib/sanity/mutationClient";
import type { GiveawayIgnoredItemKind, GiveawayIgnoreReason } from "@/src/types/giveaways";
import { GIVEAWAY_IGNORED_ITEMS_ID } from "./constants";
import { ignoredIdentity, type IgnoredItems } from "./dedupe";

export type IgnoredEntryRow = {
  _key: string;
  kind?: GiveawayIgnoredItemKind;
  value?: string;
  reason?: GiveawayIgnoreReason;
};

export const ignoredEntriesQuery = `*[_id == $ignoredId][0].entries[]{_key, kind, value, reason}`;

export function toIgnoredMap(rows: IgnoredEntryRow[] | null | undefined): IgnoredItems {
  const map: IgnoredItems = new Map();
  for (const row of rows ?? []) {
    if (row?.kind && row.value && row.reason) map.set(ignoredIdentity(row.kind, row.value), row.reason);
  }
  return map;
}

/** Server-only: the private ignore list as identity → reason. */
export async function loadIgnoredItems(): Promise<IgnoredItems> {
  const rows = await mutationClient.fetch<IgnoredEntryRow[] | null>(ignoredEntriesQuery, {
    ignoredId: GIVEAWAY_IGNORED_ITEMS_ID
  });
  return toIgnoredMap(rows);
}
