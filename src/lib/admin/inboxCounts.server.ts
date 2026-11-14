/** @fileoverview Unread inbox counts (new messages, key suggestions, giveaway finds), cached for a minute. */
import { unstable_cache } from "next/cache";
import { client } from "@/src/sanity/lib/client";
import { SIXTY_DAYS_MS, isoSince } from "@/src/lib/time";

export type InboxCounts = { newMessages: number; newSuggestions: number; newGiveawayFinds: number };

const inboxBadgeQuery = `{
  "newMessages": count(*[_type == "contactMessage" && status == "new" && createdAt >= $since]),
  "newSuggestions": count(*[_type == "keySuggestion" && status == "new" && createdAt >= $since]),
  "newGiveawayFinds": count(*[_type == "giveawayFind" && status == "new"])
}`;

export const getInboxCounts = unstable_cache(
  async (): Promise<InboxCounts> => {
    const since = isoSince(SIXTY_DAYS_MS);
    const row = await client.fetch<Partial<InboxCounts> | null>(inboxBadgeQuery, { since });
    return {
      newMessages: row?.newMessages ?? 0,
      newSuggestions: row?.newSuggestions ?? 0,
      newGiveawayFinds: row?.newGiveawayFinds ?? 0
    };
  },
  ["admin-inbox-badges"],
  { revalidate: 60 }
);
