import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { updateAllExpiredKeys } from "@/src/lib/sanity/sanityActions";
import { verifyCronAuth, logCronRun } from "@/src/lib/api/cronUtils";
import { Errors } from "@/src/lib/api/errors";

/** GET /api/v1/cron/update-expired-keys - Cron: update expired keys (requires cron auth) */
export async function GET(req: NextRequest) {
  const { ok, source } = verifyCronAuth(req);
  if (!ok) return Errors.unauthorized("Cron auth required");

  try {
    await updateAllExpiredKeys();
    await logCronRun(client, { job: "update-expired-keys", source, status: "ok" });
    return NextResponse.json({
      data: { message: "Expired keys updated successfully" },
      meta: {}
    });
  } catch (err) {
    console.error("[GET /api/v1/cron/update-expired-keys]", err);
    await logCronRun(client, {
      job: "update-expired-keys",
      source,
      status: "error",
      details: err instanceof Error ? err.message : "Unknown error"
    }).catch(() => {});
    return Errors.internal();
  }
}

/** POST /api/v1/cron/update-expired-keys - Manual trigger (no auth; used by admin Key Status) */
export async function POST(req: NextRequest) {
  const source = "manual" as const;
  try {
    await updateAllExpiredKeys();
    await logCronRun(client, { job: "update-expired-keys", source, status: "ok" });
    return NextResponse.json({
      data: { success: true, message: "Expired keys updated successfully" },
      meta: {}
    });
  } catch (err) {
    console.error("[POST /api/v1/cron/update-expired-keys]", err);
    await logCronRun(client, {
      job: "update-expired-keys",
      source,
      status: "error",
      details: err instanceof Error ? err.message : "Unknown error"
    }).catch(() => {});
    return Errors.internal();
  }
}
