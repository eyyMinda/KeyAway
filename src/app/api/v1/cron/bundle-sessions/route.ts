import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { runBundleSessions } from "@/src/lib/analytics/bundleSessions";
import { verifyCronAuth, logCronRun } from "@/src/lib/api/cronUtils";
import { Errors } from "@/src/lib/api/errors";

/** GET /api/v1/cron/bundle-sessions — move idle tracking sessions into bundles. */
export async function GET(req: NextRequest) {
  const { ok, source } = verifyCronAuth(req);
  if (!ok) return Errors.unauthorized("Cron auth required");

  try {
    const result = await runBundleSessions();
    const details = result.ok ? `bundled ${result.bundled}` : (result.error ?? "failed");
    await logCronRun(client, {
      job: "bundle-sessions",
      source,
      status: result.ok ? "ok" : "error",
      details
    });
    if (!result.ok) return Errors.internal(result.error);
    return NextResponse.json({ data: result, meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/cron/bundle-sessions]", err);
    await logCronRun(client, {
      job: "bundle-sessions",
      source,
      status: "error",
      details: err instanceof Error ? err.message : "failed"
    });
    return Errors.internal();
  }
}
