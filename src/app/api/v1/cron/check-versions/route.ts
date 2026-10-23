import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { verifyCronAuth, logCronRun, type CronSource } from "@/src/lib/api/cronUtils";
import { Errors } from "@/src/lib/api/errors";
import { runAllVersionChecks, summarizeOutcomes } from "@/src/lib/versions/runVersionChecks";

export const maxDuration = 60;

async function run(source: CronSource) {
  const outcomes = await runAllVersionChecks();
  await logCronRun(client, { job: "check-versions", source, status: "ok", details: summarizeOutcomes(outcomes) });
  return outcomes;
}

async function logError(source: CronSource, err: unknown) {
  await logCronRun(client, {
    job: "check-versions",
    source,
    status: "error",
    details: err instanceof Error ? err.message : "Unknown error"
  }).catch(() => {});
}

/** GET /api/v1/cron/check-versions - Cron: look up the newest official version of every tracked program */
export async function GET(req: NextRequest) {
  const { ok, source } = verifyCronAuth(req);
  if (!ok) return Errors.unauthorized("Cron auth required");

  try {
    const outcomes = await run(source);
    return NextResponse.json({ data: { outcomes }, meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/cron/check-versions]", err);
    await logError(source, err);
    return Errors.internal();
  }
}

/** POST /api/v1/cron/check-versions - Manual run of all checks (admin session or cron auth) */
export async function POST(req: NextRequest) {
  let source: CronSource = "manual";
  const cron = verifyCronAuth(req);
  if (!cron.ok) {
    const admin = await requireAdminSession();
    if (admin instanceof Response) return admin;
  } else {
    source = cron.source;
  }

  try {
    const outcomes = await run(source);
    return NextResponse.json({ data: { outcomes }, meta: {} });
  } catch (err) {
    console.error("[POST /api/v1/cron/check-versions]", err);
    await logError(source, err);
    return Errors.internal();
  }
}
