import { unstable_cache } from "next/cache";
import { db } from "@/src/lib/db/postgres";
import { PUBLIC_ISR_REVALIDATE_SECONDS } from "@/src/lib/cache/constants";
import type { ShareCounts, ShareNetworkId } from "@/src/lib/share/buildSharePayload";

const NETWORKS: ShareNetworkId[] = ["facebook", "twitter", "telegram", "pinterest", "tumblr", "linkedin"];
const SOCIAL_VALUES = NETWORKS.map(n => `share-${n}`);

/** Share-button clicks per network for one program or one page path (session `social_click` events). */
export function queryShareCounts(filter: { programSlug: string } | { path: string }, tag: string): Promise<ShareCounts> {
  const [column, value] = "programSlug" in filter ? (["program_slug", filter.programSlug] as const) : (["path", filter.path] as const);
  return unstable_cache(
    async () => {
      const sql = db();
      const rows = await sql<Array<{ social: string; count: number }>>`
        select social, count(*)::int as count
        from analytics.events
        where event = 'social_click' and social in ${sql(SOCIAL_VALUES)} and ${sql(column)} = ${value}
        group by social
      `;
      const out: ShareCounts = {};
      for (const row of rows) out[row.social.replace("share-", "") as ShareNetworkId] = row.count;
      return out;
    },
    ["share-counts", column, value],
    { tags: [tag], revalidate: PUBLIC_ISR_REVALIDATE_SECONDS }
  )().catch(err => {
    // Render the page without counts rather than fail; the fallback is not cached.
    console.error("[queryShareCounts]", err);
    return {};
  });
}
