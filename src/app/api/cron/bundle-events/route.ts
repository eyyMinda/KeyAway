import { NextResponse } from "next/server";
import { runBundleEvents } from "@/src/lib/bundleEvents";

function verifyCronAuth(req: Request): boolean {
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;
  if (req.headers.get("x-vercel-cron") === "1") return true;
  return false;
}

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runBundleEvents(false);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, created: result.created, appended: result.appended },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    created: result.created,
    appended: result.appended,
    message:
      result.created > 0 || result.appended > 0
        ? `Bundled ${result.created} new bundle(s), appended ${result.appended} events`
        : "No events to bundle. Deletion is commented out for testing."
  });
}
