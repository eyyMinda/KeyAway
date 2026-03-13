import { NextRequest, NextResponse } from "next/server";
import { runBundleEvents } from "@/src/lib/analytics/bundleEvents";
import { Errors } from "@/src/lib/api/errors";

function verifyCronAuth(req: Request): boolean {
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.NEXT_PUBLIC_CRON_SECRET;
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;
  if (req.headers.get("x-vercel-cron") === "1") return true;
  return false;
}

/** GET /api/v1/cron/bundle-events - Cron: bundle tracking events */
export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) return Errors.unauthorized("Cron auth required");

  try {
    const result = await runBundleEvents(false);

    if (!result.ok) {
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
    return Errors.internal();
  }
}
