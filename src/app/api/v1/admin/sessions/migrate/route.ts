import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { migrationPreview, runMigrationBatch, verifyMigration, attachHashlessRows, deleteConvertedBatch } from "@/src/lib/analytics/migrateEventsToSessions";

export const maxDuration = 60;

/** GET preview. POST batch | verify | hashless | delete. Delete only removes copied tracking events and event bundles. */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();
  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;
  try {
    return NextResponse.json({ data: await migrationPreview(), meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/admin/sessions/migrate]", err);
    return Errors.internal();
  }
}

export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();
  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;
  const body = (await req.json().catch(() => ({}))) as { action?: string; catchUp?: boolean; restart?: boolean };
  try {
    if (body.action === "verify") return NextResponse.json({ data: await verifyMigration(), meta: {} });
    if (body.action === "hashless") return NextResponse.json({ data: await attachHashlessRows(), meta: {} });
    if (body.action === "delete") {
      return NextResponse.json({ data: await deleteConvertedBatch({ restart: body.restart === true }), meta: {} });
    }
    if (body.action === "batch") {
      return NextResponse.json({ data: await runMigrationBatch({ catchUp: body.catchUp === true }), meta: {} });
    }
    return Errors.validation('action must be "batch", "verify", "hashless", or "delete"');
  } catch (err) {
    console.error("[POST /api/v1/admin/sessions/migrate]", err);
    const message = err instanceof Error ? err.message : "Convert failed";
    return Errors.internal(message.slice(0, 400));
  }
}
