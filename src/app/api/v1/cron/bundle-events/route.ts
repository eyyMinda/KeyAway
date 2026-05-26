import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { client } from "@/src/sanity/lib/client";
import { runBundleEvents } from "@/src/lib/analytics/bundleEvents";
import { runSyncProgramStatsRollup } from "@/src/lib/analytics/syncProgramStatsRollup";
import { TAG_HOMEPAGE_PROGRAMS, TAG_PROGRAM_LISTINGS } from "@/src/lib/cache/cacheTags";
import { verifyCronAuth, logCronRun } from "@/src/lib/api/cronUtils";
import { Errors } from "@/src/lib/api/errors";

/** GET /api/v1/cron/bundle-events - Cron: bundle tracking events */
export async function GET(req: NextRequest) {
  const { ok, source } = verifyCronAuth(req);
  if (!ok) return Errors.unauthorized("Cron auth required");

  try {
    const result = await runBundleEvents(false);

    if (!result.ok) {
      await logCronRun(client, {
        job: "bundle-events",
        source,
        status: "error",
        details: result.error ?? `created=${result.created} appended=${result.appended}`
      });
      return NextResponse.json(
        {
          error: {
            code: "BUNDLE_FAILED",
            message: result.error ?? "Bundle failed",
            details: [{ created: result.created, appended: result.appended }]
          }
        },
        { status: 500 }
      );
    }

    const details =
      result.created > 0 || result.appended > 0
        ? `${result.created} new, ${result.appended} appended`
        : "No events to bundle";

    const rollup = await runSyncProgramStatsRollup();
    if (rollup.ok && rollup.patched > 0) {
      revalidateTag(TAG_PROGRAM_LISTINGS, "max");
      revalidateTag(TAG_HOMEPAGE_PROGRAMS, "max");
    }

    const rollupNote = rollup.ok ? `, stats synced (${rollup.patched} programs)` : rollup.error ? `, stats sync failed` : "";
    await logCronRun(client, { job: "bundle-events", source, status: "ok", details: details + rollupNote });

    return NextResponse.json({
      data: {
        created: result.created,
        appended: result.appended,
        statsPatched: rollup.patched,
        message:
          result.created > 0 || result.appended > 0
            ? `Bundled ${result.created} new bundle(s), appended ${result.appended} events${rollupNote}`
            : `No events to bundle${rollupNote}`
      },
      meta: {}
    });
  } catch (err) {
    console.error("[GET /api/v1/cron/bundle-events]", err);
    await logCronRun(client, {
      job: "bundle-events",
      source,
      status: "error",
      details: err instanceof Error ? err.message : "Unknown error"
    }).catch(() => {});
    return Errors.internal();
  }
}
