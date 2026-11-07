/**
 * @fileoverview Admin PATCH to fix key reports: `eventType` for one or many (`reportIds`); `triedVersionFit`
 * (listed / other) and `triedVersion` for one.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { adminUpdateKeyReport, adminUpdateKeyReports, getKeyReportFit } from "@/src/lib/analytics/keyReportStore";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import type { KeyReportEvent } from "@/src/types";
import { isValidTriedVersionInput, normalizeTriedVersionForStorage } from "@/src/lib/program/versionFitLabel";

const REPORT_EVENTS = new Set<KeyReportEvent>(["report_key_working", "report_key_expired", "report_key_limit_reached"]);
const VERSION_FITS = new Set(["listed", "other"]);
const MAX_BULK_REPORTS = 2000;

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

    if (Array.isArray(b.reportIds)) {
      const ids = [...new Set(b.reportIds.filter((id): id is string => typeof id === "string"))];
      if (!ids.length) return Errors.validation("reportIds required");
      if (ids.length > MAX_BULK_REPORTS) return Errors.validation(`At most ${MAX_BULK_REPORTS} reports at once`);
      if (!REPORT_EVENTS.has(eventType as KeyReportEvent)) return Errors.validation("Invalid eventType");
      const updated = await adminUpdateKeyReports(ids, eventType as KeyReportEvent);
      return NextResponse.json({ data: updated, meta: { count: updated.length } });
    }

    const triedVersionRaw = typeof b.triedVersion === "string" ? b.triedVersion.trim() : undefined;
    const hasTriedVersion = triedVersionRaw !== undefined;
    const fitRaw = typeof b.triedVersionFit === "string" ? b.triedVersionFit.trim() : "";

    if (!reportId) return Errors.validation("reportId required");
    if (!eventType && !hasTriedVersion && !fitRaw) {
      return Errors.validation("eventType, triedVersionFit and/or triedVersion required");
    }
    if (eventType && !REPORT_EVENTS.has(eventType as KeyReportEvent)) {
      return Errors.validation("Invalid eventType");
    }
    if (fitRaw && !VERSION_FITS.has(fitRaw)) {
      return Errors.validation("triedVersionFit must be listed or other");
    }
    const triedVersionFit = fitRaw ? (fitRaw as "listed" | "other") : undefined;

    const doc = await getKeyReportFit(reportId);
    if (!doc) return Errors.notFound("Report not found");

    const effectiveEvent = (eventType || doc.eventType) as KeyReportEvent | undefined;
    const effectiveFit = triedVersionFit ?? doc.triedVersionFit;

    if ((hasTriedVersion || triedVersionFit) && effectiveEvent === "report_key_working") {
      return Errors.validation("Version fit applies only to expired or limit reached reports");
    }
    if (hasTriedVersion) {
      if (!triedVersionRaw) return Errors.validation("triedVersion cannot be empty");
      if (!isValidTriedVersionInput(triedVersionRaw)) {
        return Errors.validation("triedVersion must match format 16 or 16.0");
      }
      if (effectiveFit !== "other") {
        return Errors.validation("triedVersion can only be set when triedVersionFit is other");
      }
    }
    if (triedVersionFit === "other" && !hasTriedVersion && doc.triedVersionFit !== "other") {
      return Errors.validation("triedVersion is required when switching to other version");
    }

    let triedVersion: string | undefined;
    if (hasTriedVersion && triedVersionRaw) {
      triedVersion = normalizeTriedVersionForStorage(triedVersionRaw) ?? undefined;
      if (!triedVersion) return Errors.validation("Invalid triedVersion");
    }

    const updated = await adminUpdateKeyReport(reportId, {
      eventType: eventType ? (eventType as KeyReportEvent) : undefined,
      triedVersionFit,
      triedVersion
    });
    if (!updated) return Errors.notFound("Report not found");
    return NextResponse.json({ data: [updated], meta: { count: 1 } });
  } catch (err) {
    console.error("[PATCH /api/v1/admin/key-report-event]", err);
    return Errors.internal();
  }
}
