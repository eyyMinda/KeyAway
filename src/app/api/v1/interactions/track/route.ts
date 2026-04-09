import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { normalizePath, sanitizeTrackingToken } from "@/src/lib/api/inputNormalize";
import { TrackInteractionBody } from "@/src/types";

function hourBucket(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const h = String(date.getUTCHours()).padStart(2, "0");
  return `${y}-${m}-${d}-${h}`;
}

function buildBucketDocId(key: string): string {
  return `interactionEventBucket.${key.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 220)}`;
}

export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  try {
    const body = (await req.json()) as TrackInteractionBody;
    const interactionId = typeof body?.interactionId === "string" ? sanitizeTrackingToken(body.interactionId) : "";
    const sectionId = typeof body?.sectionId === "string" ? sanitizeTrackingToken(body.sectionId) : "";
    const pagePath = normalizePath(typeof body?.pagePath === "string" ? body.pagePath : "/");
    const programSlug = typeof body?.programSlug === "string" ? sanitizeTrackingToken(body.programSlug) : undefined;

    if (!interactionId) return Errors.validation("interactionId required");
    if (!sectionId) return Errors.validation("sectionId required");
    if (interactionId.length > 120 || sectionId.length > 80) return Errors.validation("interaction payload too long");

    const host = req.headers.get("host") || "";
    if (host.startsWith("localhost") || host.includes("127.0.0.1")) {
      return NextResponse.json({ data: { accepted: true, skipped: true }, meta: {} });
    }

    const bucketDateHour = hourBucket();
    const bucketKey = `${bucketDateHour}|${pagePath}|${sectionId}|${interactionId}|${programSlug || "-"}`;
    const docId = buildBucketDocId(bucketKey);
    const now = new Date().toISOString();

    await client
      .transaction()
      .createIfNotExists({
        _id: docId,
        _type: "interactionEventBucket",
        bucketKey,
        bucketDateHour,
        pagePath,
        sectionId,
        interactionId,
        ...(programSlug ? { programSlug } : {}),
        count: 0,
        createdAt: now,
        lastSeenAt: now
      })
      .patch(docId, p => p.inc({ count: 1 }).set({ lastSeenAt: now }))
      .commit();

    return NextResponse.json({ data: { accepted: true }, meta: {} });
  } catch (err) {
    console.error("[POST /api/v1/interactions/track]", err);
    return Errors.internal();
  }
}
