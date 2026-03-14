import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { runBundleEvents } from "@/src/lib/analytics/bundleEvents";
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
    await logCronRun(client, { job: "bundle-events", source, status: "ok", details });

    return NextResponse.json({
      data: {
        created: result.created,
        appended: result.appended,
        message:
          result.created > 0 || result.appended > 0
            ? `Bundled ${result.created} new bundle(s), appended ${result.appended} events`
            : "No events to bundle."
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
