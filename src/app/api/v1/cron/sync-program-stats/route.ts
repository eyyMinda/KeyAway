import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { client } from "@/src/sanity/lib/client";
import { runSyncProgramStatsRollup } from "@/src/lib/analytics/syncProgramStatsRollup";
import { TAG_HOMEPAGE_PROGRAMS, TAG_PROGRAM_LISTINGS } from "@/src/lib/cache/cacheTags";
import { verifyCronAuth, logCronRun } from "@/src/lib/api/cronUtils";
import { Errors } from "@/src/lib/api/errors";

/** GET /api/v1/cron/sync-program-stats — write session view and download counts onto programs. */
export async function GET(req: NextRequest) {
  const { ok, source } = verifyCronAuth(req);
  if (!ok) return Errors.unauthorized("Cron auth required");

  try {
    const rollup = await runSyncProgramStatsRollup();
    if (!rollup.ok) {
      await logCronRun(client, {
        job: "sync-program-stats",
        source,
        status: "error",
        details: rollup.error ?? "stats sync failed"
      });
      return Errors.internal(rollup.error);
    }

    if (rollup.patched > 0) {
      revalidateTag(TAG_PROGRAM_LISTINGS, "max");
      revalidateTag(TAG_HOMEPAGE_PROGRAMS, "max");
    }

    const details = `stats synced (${rollup.patched} programs)`;
    await logCronRun(client, { job: "sync-program-stats", source, status: "ok", details });
    return NextResponse.json({ data: { statsPatched: rollup.patched, message: details }, meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/cron/sync-program-stats]", err);
    await logCronRun(client, {
      job: "sync-program-stats",
      source,
      status: "error",
      details: err instanceof Error ? err.message : "Unknown error"
    }).catch(() => {});
    return Errors.internal();
  }
}
