import type { SanityClient } from "next-sanity";
import { privateDocId } from "@/src/lib/sanity/privateDocId";

export type CronSource = "vercel_cron" | "bearer" | "manual";
export type CronJob =
  | "sync-program-stats"
  | "update-expired-keys"
  | "prune-cron-runs"
  | "discover-giveaways"
  | "check-versions";

/**
 * Verifies cron auth: `Authorization: Bearer CRON_SECRET`, which Vercel cron sends when CRON_SECRET is set.
 * A plain `x-vercel-cron` header is not trusted: any client can send it.
 */
export function verifyCronAuth(req: Request): { ok: boolean; source: CronSource } {
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth === `Bearer ${cronSecret}`) return { ok: true, source: "bearer" };
  return { ok: false, source: "manual" };
}

export async function logCronRun(
  client: SanityClient,
  opts: { job: CronJob; source: CronSource; status: "ok" | "error"; details?: string }
): Promise<void> {
  try {
    await client.create({
      _id: privateDocId("cronRun"),
      _type: "cronRun",
      job: opts.job,
      source: opts.source,
      status: opts.status,
      ...(opts.details && { details: opts.details }),
      ranAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("[logCronRun]", err);
  }
}
