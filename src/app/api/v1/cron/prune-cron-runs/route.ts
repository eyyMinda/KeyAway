import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { verifyCronAuth, logCronRun } from "@/src/lib/api/cronUtils";
import { Errors } from "@/src/lib/api/errors";
import { runAnalyticsRollup } from "@/src/lib/analytics/rollupStore";
import { WEEK_MS, isoSince } from "@/src/lib/time";

const RETENTION_MS = WEEK_MS;
const BATCH = 200;
/** Reviewed giveaway finds (added/dismissed) not seen on their source page for this long are deleted. */
const GIVEAWAY_FIND_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
/** Time for folding old analytics days into the rollups; a backlog carries over to the next run. */
const ROLLUP_BUDGET_MS = 40_000;

/**
 * GET /api/v1/cron/prune-cron-runs — delete `cronRun` docs older than 7 days (batched),
 * plus reviewed `giveawayFind` docs not seen for 90 days, then roll up analytics days past the raw window.
 */
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const { ok, source } = verifyCronAuth(req);
  if (!ok) return Errors.unauthorized("Cron auth required");

  const cutoff = isoSince(RETENTION_MS);
  let deleted = 0;

  try {
    for (let i = 0; i < 50; i++) {
      const ids = await client.fetch<string[]>(
        `*[_type == "cronRun" && ranAt < $cutoff] | order(ranAt asc) [0...${BATCH - 1}]._id`,
        { cutoff }
      );
      if (!ids?.length) break;

      const tx = client.transaction();
      for (const id of ids) tx.delete(id);
      await tx.commit();
      deleted += ids.length;
      if (ids.length < BATCH) break;
    }

    const findCutoff = isoSince(GIVEAWAY_FIND_RETENTION_MS);
    const findIds = await client.fetch<string[]>(
      `*[_type == "giveawayFind" && status in ["added", "dismissed"] && lastSeenAt < $findCutoff][0...${BATCH - 1}]._id`,
      { findCutoff }
    );
    if (findIds?.length) {
      const tx = client.transaction();
      for (const id of findIds) tx.delete(id);
      await tx.commit();
    }

    const rollup = await runAnalyticsRollup(ROLLUP_BUDGET_MS);

    const details =
      `deleted ${deleted} cronRun docs older than ${cutoff}, ${findIds?.length ?? 0} old giveaway finds; ` +
      `rolled up ${rollup.days} analytics days (${rollup.events} events, ${rollup.sessions} sessions, ` +
      `${rollup.visitors} one-time visitors pruned), raw from ${rollup.rolledUntil ?? "start"}`;
    console.info("[prune-cron-runs]", details);
    await logCronRun(client, { job: "prune-cron-runs", source, status: "ok", details });
    return NextResponse.json({
      data: { deleted, cutoff, deletedGiveawayFinds: findIds?.length ?? 0, analyticsRollup: rollup },
      meta: {}
    });
  } catch (err) {
    console.error("[GET /api/v1/cron/prune-cron-runs]", err);
    await logCronRun(client, {
      job: "prune-cron-runs",
      source,
      status: "error",
      details: err instanceof Error ? err.message : "Unknown error"
    }).catch(() => {});
    return Errors.internal();
  }
}
