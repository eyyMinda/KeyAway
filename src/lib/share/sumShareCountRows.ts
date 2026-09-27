import type { ShareCounts, ShareNetworkId } from "@/src/lib/share/buildSharePayload";

const NETWORKS: ShareNetworkId[] = ["facebook", "twitter", "telegram", "pinterest", "tumblr", "linkedin"];

/** Sum per-network counts from live sessions and session bundles. */
export function sumShareCountRows(
  live: Array<Record<string, number>> | undefined,
  bundled: Array<Record<string, number>> | undefined
): ShareCounts {
  const out: ShareCounts = {};
  for (const network of NETWORKS) {
    let total = 0;
    for (const row of live ?? []) total += row[network] ?? 0;
    for (const row of bundled ?? []) total += row[network] ?? 0;
    if (total > 0) out[network] = total;
  }
  return out;
}
