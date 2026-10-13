import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { verifyCronAuth, logCronRun, type CronSource } from "@/src/lib/api/cronUtils";
import { Errors } from "@/src/lib/api/errors";
import { formatDiscoverySummary, runDiscovery } from "@/src/lib/giveaways/runDiscovery";
import type { GiveawaySourceId } from "@/src/types/giveaways";

export const maxDuration = 60;

async function run(source: CronSource, opts: { dryRun?: boolean; sourceIds?: GiveawaySourceId[] }) {
  const result = await runDiscovery(opts);
  if (!opts.dryRun) {
    await logCronRun(client, {
      job: "discover-giveaways",
      source,
      status: "ok",
      details: formatDiscoverySummary(result.summary)
    });
  }
  return result;
}

async function logError(source: CronSource, err: unknown) {
  await logCronRun(client, {
    job: "discover-giveaways",
    source,
    status: "error",
    details: err instanceof Error ? err.message : "Unknown error"
  }).catch(() => {});
}

/** GET /api/v1/cron/discover-giveaways - Cron: scan giveaway sites for existing programs (requires cron auth) */
export async function GET(req: NextRequest) {
  const { ok, source } = verifyCronAuth(req);
  if (!ok) return Errors.unauthorized("Cron auth required");

  try {
    const { summary } = await run(source, {});
    return NextResponse.json({ data: { summary }, meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/cron/discover-giveaways]", err);
    await logError(source, err);
    return Errors.internal();
  }
}

/**
 * POST /api/v1/cron/discover-giveaways - Manual run (admin session or cron auth).
 * Body: `{ dryRun?: boolean, sourceIds?: string[] }`. A dry run returns the would-be finds without writing.
 */
export async function POST(req: NextRequest) {
  let source: CronSource = "manual";
  const cron = verifyCronAuth(req);
  if (!cron.ok) {
    const admin = await requireAdminSession();
    if (admin instanceof Response) return admin;
  } else {
    source = cron.source;
  }

  const body = (await req.json().catch(() => ({}))) as { dryRun?: unknown; sourceIds?: unknown };
  // Source keys live in the private settings document; unknown keys simply match nothing.
  const sourceIds = Array.isArray(body.sourceIds)
    ? (body.sourceIds.filter(id => typeof id === "string" && /^[a-z0-9-]{1,32}$/.test(id)) as GiveawaySourceId[])
    : undefined;
  if (Array.isArray(body.sourceIds) && body.sourceIds.length && !sourceIds?.length) {
    return Errors.validation("sourceIds must be source keys from the giveaway discovery settings");
  }
  const dryRun = body.dryRun === true;

  try {
    const result = await run(source, { dryRun, sourceIds });
    return NextResponse.json({ data: dryRun ? result : { summary: result.summary }, meta: {} });
  } catch (err) {
    console.error("[POST /api/v1/cron/discover-giveaways]", err);
    if (!dryRun) await logError(source, err);
    return Errors.internal();
  }
}
