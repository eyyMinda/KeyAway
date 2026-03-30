/** @fileoverview Admin PATCH to fix a single keyReport `eventType` (modal save). */
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { client } from "@/src/sanity/lib/client";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import type { KeyReportEvent } from "@/src/types";

const REPORT_EVENTS = new Set<KeyReportEvent>(["report_key_working", "report_key_expired", "report_key_limit_reached"]);

export async function PATCH(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const body = await req.json().catch(() => ({}));
    const b = body as Record<string, unknown>;
    const reportId = typeof b.reportId === "string" ? b.reportId.trim() : "";
    const eventType = typeof b.eventType === "string" ? b.eventType.trim() : "";

    if (!reportId || !eventType || !REPORT_EVENTS.has(eventType as KeyReportEvent)) {
      return Errors.validation("reportId and valid eventType required");
    }

    const doc = await client.fetch<{ _id: string } | null>(`*[_type == "keyReport" && _id == $id][0]{ _id }`, {
      id: reportId
    });
    if (!doc) return Errors.notFound("Report not found");

    const updated = await client
      .patch(reportId)
      .set({ eventType, createdAt: new Date().toISOString() })
      .commit();

    const u = updated as Record<string, unknown>;
    return NextResponse.json({ data: { _id: u._id, eventType: u.eventType }, meta: {} });
  } catch (err) {
    console.error("[PATCH /api/v1/admin/key-report-event]", err);
    return Errors.internal();
  }
}
