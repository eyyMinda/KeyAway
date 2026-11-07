import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { deleteDraw, getDraw, parseDrawUpdate, updateDraw } from "@/src/lib/giveaways/drawStore";

type Params = { params: Promise<{ id: string }> };

/** GET /api/v1/admin/giveaway-draws/[id] - One giveaway with entrants */
export async function GET(req: NextRequest, { params }: Params) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const draw = await getDraw((await params).id);
    if (!draw) return Errors.notFound("Giveaway not found");
    return NextResponse.json({ data: draw, meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/admin/giveaway-draws/[id]]", err);
    return Errors.internal();
  }
}

/** PATCH /api/v1/admin/giveaway-draws/[id] - Update details, prizes, entrants, winners or status */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    let update;
    try {
      update = parseDrawUpdate(await req.json().catch(() => ({})));
    } catch (err) {
      return Errors.validation(err instanceof Error ? err.message : "Invalid update");
    }
    if (Object.keys(update).length === 0) return Errors.validation("Nothing to update");

    const draw = await updateDraw((await params).id, update);
    if (!draw) return Errors.notFound("Giveaway not found");
    return NextResponse.json({ data: draw, meta: {} });
  } catch (err) {
    console.error("[PATCH /api/v1/admin/giveaway-draws/[id]]", err);
    return Errors.internal();
  }
}

/** DELETE /api/v1/admin/giveaway-draws/[id] */
export async function DELETE(req: NextRequest, { params }: Params) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const deleted = await deleteDraw((await params).id);
    if (!deleted) return Errors.notFound("Giveaway not found");
    return NextResponse.json({ data: { ok: true }, meta: {} });
  } catch (err) {
    console.error("[DELETE /api/v1/admin/giveaway-draws/[id]]", err);
    return Errors.internal();
  }
}
