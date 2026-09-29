/** @fileoverview Admin PATCH to fix a keyReport `eventType` and/or `triedVersion`. Live doc or archived bundle row. */
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { client } from "@/src/sanity/lib/client";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import type { KeyReportEvent } from "@/src/types";
import { isValidTriedVersionInput, normalizeTriedVersionForStorage } from "@/src/lib/program/versionFitLabel";

const REPORT_EVENTS = new Set<KeyReportEvent>(["report_key_working", "report_key_expired", "report_key_limit_reached"]);

type ReportShape = { eventType?: KeyReportEvent; triedVersionFit?: string };

export async function PATCH(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const body = await req.json().catch(() => ({}));
    const b = body as Record<string, unknown>;
    const reportId = typeof b.reportId === "string" ? b.reportId.trim() : "";
    const bundleId = typeof b.bundleId === "string" ? b.bundleId.trim() : "";
    const rowKey = typeof b.rowKey === "string" ? b.rowKey.trim() : "";
    const eventType = typeof b.eventType === "string" ? b.eventType.trim() : "";
    const triedVersionRaw = typeof b.triedVersion === "string" ? b.triedVersion.trim() : undefined;
    const hasTriedVersion = triedVersionRaw !== undefined;

    const isBundled = !reportId && Boolean(bundleId && rowKey);
    if (!reportId && !isBundled) return Errors.validation("reportId or bundleId+rowKey required");
    if (!eventType && !hasTriedVersion) {
      return Errors.validation("eventType and/or triedVersion required");
    }
    if (eventType && !REPORT_EVENTS.has(eventType as KeyReportEvent)) {
      return Errors.validation("Invalid eventType");
    }

    // Load the current row (live doc or bundle element) to validate the tried-version rules.
    const doc = isBundled
      ? await client.fetch<ReportShape | null>(
          `*[_type == "keyReportBundle" && _id == $bundleId][0].reports[_key == $rowKey][0]{ eventType, triedVersionFit }`,
          { bundleId, rowKey }
        )
      : await client.fetch<ReportShape | null>(
          `*[_type == "keyReport" && _id == $id][0]{ eventType, triedVersionFit }`,
          { id: reportId }
        );
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

    const now = new Date().toISOString();

    if (isBundled) {
      // Keyed array path: patch the single element inside keyReportBundle.reports.
      const at = (field: string) => `reports[_key=="${rowKey}"].${field}`;
      const patch = client.patch(bundleId);
      const setFields: Record<string, unknown> = {};
      if (eventType && REPORT_EVENTS.has(eventType as KeyReportEvent)) {
        setFields[at("eventType")] = eventType;
        setFields[at("createdAt")] = now;
        if (eventType === "report_key_working") {
          patch.unset([at("triedVersionFit"), at("triedVersion"), at("listedVersion")]);
        }
      }
      if (hasTriedVersion && triedVersionRaw) {
        const normalized = normalizeTriedVersionForStorage(triedVersionRaw);
        if (!normalized) return Errors.validation("Invalid triedVersion");
        setFields[at("triedVersion")] = normalized;
      }
      if (Object.keys(setFields).length) patch.set(setFields);
      patch.set({ updatedAt: now });
      await patch.commit();
      return NextResponse.json({ data: { bundleId, rowKey, eventType: eventType || doc.eventType }, meta: {} });
    }

    const patch = client.patch(reportId);
    if (eventType && REPORT_EVENTS.has(eventType as KeyReportEvent)) {
      patch.set({ eventType, createdAt: now });
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
      data: { _id: u._id, eventType: u.eventType, triedVersion: u.triedVersion },
      meta: {}
    });
  } catch (err) {
    console.error("[PATCH /api/v1/admin/key-report-event]", err);
    return Errors.internal();
  }
}
