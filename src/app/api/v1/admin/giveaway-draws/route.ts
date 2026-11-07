import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { createDraw, listDraws, parseDrawUpdate } from "@/src/lib/giveaways/drawStore";

/** GET /api/v1/admin/giveaway-draws - Giveaways newest first (no entrants; winners for "won before" flags) */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const draws = await listDraws();
    return NextResponse.json({ data: draws, meta: { total: draws.length } });
  } catch (err) {
    console.error("[GET /api/v1/admin/giveaway-draws]", err);
    return Errors.internal();
  }
}

/** POST /api/v1/admin/giveaway-draws - Create a giveaway */
export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    let input;
    try {
      input = parseDrawUpdate(await req.json().catch(() => ({})));
    } catch (err) {
      return Errors.validation(err instanceof Error ? err.message : "Invalid giveaway");
    }
    if (!input.title) return Errors.validation("title is required", [{ field: "title", message: "Required" }]);

    const draw = await createDraw({ ...input, title: input.title });
    return NextResponse.json({ data: draw, meta: {} }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/v1/admin/giveaway-draws]", err);
    return Errors.internal();
  }
}
