/** @fileoverview Admin PATCH to fix a single keyReport `eventType` and/or `triedVersion` (modal save). */
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { client } from "@/src/sanity/lib/client";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import type { KeyReportEvent } from "@/src/types";
import {
  isValidTriedVersionInput,
  normalizeTriedVersionForStorage
} from "@/src/lib/program/versionFitLabel";

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
    const triedVersionRaw = typeof b.triedVersion === "string" ? b.triedVersion.trim() : undefined;
    const hasTriedVersion = triedVersionRaw !== undefined;

    if (!reportId) return Errors.validation("reportId required");
    if (!eventType && !hasTriedVersion) {
      return Errors.validation("eventType and/or triedVersion required");
    }
    if (eventType && !REPORT_EVENTS.has(eventType as KeyReportEvent)) {
      return Errors.validation("Invalid eventType");
    }

    const doc = await client.fetch<{
      _id: string;
      eventType?: KeyReportEvent;
      triedVersionFit?: string;
    } | null>(`*[_type == "keyReport" && _id == $id][0]{ _id, eventType, triedVersionFit }`, {
      id: reportId
    });
    if (!doc) return Errors.notFound("Report not found");

    const effectiveEvent = (eventType || doc.eventType) as KeyReportEvent | undefined;

    if (hasTriedVersion) {
      if (!triedVersionRaw) return Errors.validation("triedVersion cannot be empty");
      if (!isValidTriedVersionInput(triedVersionRaw)) {
        return Errors.validation("triedVersion must match format 16 or 16.0");
      }
      if (effectiveEvent === "report_key_working") {
        return Errors.validation("triedVersion applies only to expired or limit reached reports");
      }
      if (doc.triedVersionFit !== "other") {
        return Errors.validation("triedVersion can only be edited when triedVersionFit is other");
      }
    }

    const patch = client.patch(reportId);

    if (eventType && REPORT_EVENTS.has(eventType as KeyReportEvent)) {
      patch.set({ eventType, createdAt: new Date().toISOString() });
      if (eventType === "report_key_working") {
        patch.unset(["triedVersionFit", "triedVersion", "listedVersion"]);
      }
    }

    if (hasTriedVersion && triedVersionRaw) {
      const normalized = normalizeTriedVersionForStorage(triedVersionRaw);
      if (!normalized) return Errors.validation("Invalid triedVersion");
      patch.set({ triedVersion: normalized });
    }

    const updated = await patch.commit();

    const u = updated as Record<string, unknown>;
    return NextResponse.json({
      data: {
        _id: u._id,
        eventType: u.eventType,
        triedVersion: u.triedVersion
      },
      meta: {}
    });
  } catch (err) {
    console.error("[PATCH /api/v1/admin/key-report-event]", err);
    return Errors.internal();
  }
}
