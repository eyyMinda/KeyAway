import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { verifyCronAuth, logCronRun } from "@/src/lib/api/cronUtils";
import { Errors } from "@/src/lib/api/errors";

const RETENTION_MS = 60 * 24 * 60 * 60 * 1000;
const BATCH = 200;

/** GET /api/v1/cron/prune-cron-runs — delete `cronRun` docs older than ~60 days (batched). */
export async function GET(req: NextRequest) {
  const { ok, source } = verifyCronAuth(req);
  if (!ok) return Errors.unauthorized("Cron auth required");

  const cutoff = new Date(Date.now() - RETENTION_MS).toISOString();
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

    const details = `deleted ${deleted} cronRun docs older than ${cutoff}`;
    console.info("[prune-cron-runs]", details);
    await logCronRun(client, { job: "prune-cron-runs", source, status: "ok", details });
    return NextResponse.json({ data: { deleted, cutoff }, meta: {} });
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
