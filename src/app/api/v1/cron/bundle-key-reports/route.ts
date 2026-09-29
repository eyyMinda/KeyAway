import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { runBundleKeyReports } from "@/src/lib/analytics/bundleKeyReports";
import { verifyCronAuth, logCronRun } from "@/src/lib/api/cronUtils";
import { Errors } from "@/src/lib/api/errors";

/** GET /api/v1/cron/bundle-key-reports - Cron: archive key reports older than retention into keyReportBundle. */
export async function GET(req: NextRequest) {
  const { ok, source } = verifyCronAuth(req);
  if (!ok) return Errors.unauthorized("Cron auth required");

  try {
    const result = await runBundleKeyReports();

    if (!result.ok) {
      await logCronRun(client, {
        job: "bundle-key-reports",
        source,
        status: "error",
        details: result.error ?? `bundled=${result.bundled}`
      });
      return NextResponse.json(
        { error: { code: "BUNDLE_FAILED", message: result.error ?? "Bundle failed", details: [{ bundled: result.bundled }] } },
        { status: 500 }
      );
    }

    const details = result.bundled > 0 ? `bundled ${result.bundled}` : "No reports to bundle";
    await logCronRun(client, { job: "bundle-key-reports", source, status: "ok", details });

    return NextResponse.json({ data: { bundled: result.bundled }, meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/cron/bundle-key-reports]", err);
    await logCronRun(client, {
      job: "bundle-key-reports",
      source,
      status: "error",
      details: err instanceof Error ? err.message : "Unknown error"
    }).catch(() => {});
    return Errors.internal();
  }
}
