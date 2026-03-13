import { NextRequest, NextResponse } from "next/server";
import { updateAllExpiredKeys } from "@/src/lib/sanity/sanityActions";
import { Errors } from "@/src/lib/api/errors";

function isCronRequest(req: Request): boolean {
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;
  if (req.headers.get("x-vercel-cron") === "1") return true;
  return false;
}

/** GET /api/v1/cron/update-expired-keys - Cron: update expired keys (requires cron auth) */
export async function GET(req: NextRequest) {
  if (!isCronRequest(req)) return Errors.unauthorized("Cron auth required");

  try {
    await updateAllExpiredKeys();
    return NextResponse.json({
      data: { message: "Expired keys updated successfully" },
      meta: {}
    });
  } catch (err) {
    console.error("[GET /api/v1/cron/update-expired-keys]", err);
    return Errors.internal();
  }
}

/** POST /api/v1/cron/update-expired-keys - Manual trigger (no auth; used by admin Key Status) */
export async function POST(req: NextRequest) {
  try {
    await updateAllExpiredKeys();
    return NextResponse.json({
      data: { success: true, message: "Expired keys updated successfully" },
      meta: {}
    });
  } catch (err) {
    console.error("[POST /api/v1/cron/update-expired-keys]", err);
    return Errors.internal();
  }
}
