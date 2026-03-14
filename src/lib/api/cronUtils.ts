import { SanityClient } from "@sanity/client";

export type CronSource = "vercel_cron" | "bearer" | "manual";
export type CronJob = "bundle-events" | "update-expired-keys";

/** Verifies cron auth (x-vercel-cron or Bearer token). Returns ok + source for logging. */
export function verifyCronAuth(req: Request): { ok: boolean; source: CronSource } {
  if (req.headers.get("x-vercel-cron") === "1") return { ok: true, source: "vercel_cron" };
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
