import { updateAllExpiredKeys } from "@/src/lib/sanity/sanityActions";
import { NextResponse } from "next/server";

function isCronRequest(req: Request): boolean {
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;
  if (req.headers.get("x-vercel-cron") === "1") return true;
  return false;
}

async function runUpdate() {
  await updateAllExpiredKeys();
  return NextResponse.json({
    success: true,
    message: "Expired keys updated successfully"
  });
}

export async function POST() {
  try {
    return await runUpdate();
  } catch (error) {
    console.error("Error updating expired keys:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update expired keys",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/** Vercel cron uses GET - run update when auth header present */
export async function GET(req: Request) {
  if (!isCronRequest(req)) {
    return NextResponse.json({ message: "Use POST method to update expired keys" });
  }
  try {
    return await runUpdate();
  } catch (error) {
    console.error("Error updating expired keys (cron):", error);
    return NextResponse.json({ success: false, message: "Failed to update expired keys" }, { status: 500 });
  }
}
