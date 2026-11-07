/**
 * @fileoverview IDs for documents that hold visitor data (contact messages, key suggestions, cron logs).
 *
 * The dataset is public (free plan), so anyone can query it without a token. Documents whose `_id` contains a dot
 * are only returned to authenticated requests, which is how drafts stay hidden; the same applies to `type.<uuid>`.
 * Server code and the Studio read with a token and see them as usual. Giveaway finds use the same scheme.
 */
export function privateDocId(type: string): string {
  return `${type}.${crypto.randomUUID()}`;
}
