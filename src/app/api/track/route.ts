import { NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import crypto from "crypto";

type TrackBody = {
  event: "copy_cdkey" | "download_click" | "social_click";
  meta?: Record<string, unknown>;
};

const ALLOWED_EVENTS = new Set(["copy_cdkey", "download_click", "social_click"]);

function maskKey(key?: unknown) {
  if (typeof key !== "string" || !key) return undefined;

  const trimmed = key.replace(/\s+/g, "");
  if (trimmed.length <= 6) return "***";
  return `${trimmed.slice(0, 3)}***${trimmed.slice(-3)}`; // e.g. ABC***XYZ
}

function hashIp(ip: string | undefined) {
  try {
    const salt = process.env.ANALYTICS_SALT || "";
    return crypto
      .createHash("sha256")
      .update((ip || "") + salt)
      .digest("hex");
  } catch {
    return undefined;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TrackBody;

    if (!body?.event || !ALLOWED_EVENTS.has(body.event)) {
      return NextResponse.json({ ok: false, error: "Invalid event" }, { status: 400 });
    }

    // Extract request context
    const ua = req.headers.get("user-agent") || undefined;
    const ref = req.headers.get("referer") || undefined;
    const xff = req.headers.get("x-forwarded-for") || "";
    const ip = xff.split(",")[0]?.trim() || undefined;

    // Normalize meta safely
    const programSlug = body.meta?.programSlug as string | undefined;
    const keyMasked = maskKey(body.meta?.key);
    const social = body.meta?.social as string | undefined;
    const path = body.meta?.path as string | undefined;

    // Build tracking event data - only include fields that have values
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trackingData: any = {
      _type: "trackingEvent",
      event: body.event,
      referrer: ref,
      userAgent: ua,
      ipHash: hashIp(ip),
      createdAt: new Date().toISOString()
    };

    // Add optional fields only if they have values
    if (programSlug) trackingData.programSlug = programSlug;
    if (keyMasked) trackingData.keyMasked = keyMasked;
    if (social) trackingData.social = social;
    if (path) trackingData.path = path;

    // Write to Sanity
    await client.create(trackingData);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Track error:", err);
    return NextResponse.json({ ok: false, error: "Failed to track event" }, { status: 500 });
  }
}
