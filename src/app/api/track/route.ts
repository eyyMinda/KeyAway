import { NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import crypto from "crypto";

type TrackBody = {
  event: "copy_cdkey" | "download_click" | "social_click" | "page_viewed";
  meta?: Record<string, unknown>;
};

const ALLOWED_EVENTS = new Set(["copy_cdkey", "download_click", "social_click", "page_viewed"]);

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

// Simple in-memory cache for IP locations (expires after 1 hour)
const locationCache = new Map<string, { data: { country?: string; city?: string }; expires: number }>();

// Clean up expired cache entries every 10 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, entry] of locationCache.entries()) {
      if (entry.expires <= now) {
        locationCache.delete(ip);
      }
    }
  },
  10 * 60 * 1000
); // 10 minutes

async function getLocationFromIP(ip: string | undefined): Promise<{ country?: string; city?: string } | undefined> {
  if (!ip) return undefined;

  // Check cache first
  const cached = locationCache.get(ip);
  if (cached && cached.expires > Date.now()) {
    console.log(`📦 Using cached location for IP: ${ip}`);
    return cached.data;
  }

  // Multiple geolocation services with different parsers
  const services = [
    {
      name: "ipapi.co",
      url: `https://ipapi.co/${ip}/json/`,
      parser: (data: Record<string, unknown>) => ({
        country: data.country_name as string,
        city: data.city as string
      })
    },
    {
      name: "ip-api.com",
      url: `https://ip-api.com/json/${ip}`,
      parser: (data: Record<string, unknown>) => ({
        country: data.country as string,
        city: data.city as string
      })
    },
    {
      name: "ipinfo.io",
      url: `https://ipinfo.io/${ip}/json`,
      parser: (data: Record<string, unknown>) => ({
        country: data.country as string,
        city: data.city as string
      })
    }
  ];

  // Try each service with timeout
  for (const service of services) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(service.url, {
        headers: {
          "User-Agent": "KeyAway Analytics"
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const result = service.parser(data);

        // Validate that we got meaningful data
        if (result.country || result.city) {
          console.log(`✅ Location data from ${service.name}:`, result);

          // Cache the result for 1 hour
          locationCache.set(ip, {
            data: result,
            expires: Date.now() + 60 * 60 * 1000 // 1 hour
          });

          return result;
        }
      }
    } catch (error) {
      // Log warning but continue to next service
      console.warn(`⚠️ ${service.name} failed:`, error instanceof Error ? error.message : "Unknown error");
      continue;
    }
  }

  console.warn("❌ All geolocation services failed for IP:", ip);
  return undefined;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TrackBody;

    if (!body?.event || !ALLOWED_EVENTS.has(body.event)) {
      return NextResponse.json({ ok: false, error: "Invalid event" }, { status: 400 });
    }

    // Skip tracking for localhost requests
    const host = req.headers.get("host") || "";
    if (host.startsWith("localhost") || host.includes("127.0.0.1")) {
      return NextResponse.json({ ok: true, message: "Skipped localhost tracking" });
    }

    // Extract request context
    const ua = req.headers.get("user-agent") || undefined;
    const ref = req.headers.get("referer") || undefined;
    const xff = req.headers.get("x-forwarded-for") || "";
    const ip = xff.split(",")[0]?.trim() || undefined;

    // Get location from IP (only for page_viewed events to avoid excessive API calls)
    const location = body.event === "page_viewed" ? await getLocationFromIP(ip) : undefined;

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
    if (location?.country) trackingData.country = location.country;
    if (location?.city) trackingData.city = location.city;

    // Write to Sanity
    await client.create(trackingData);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Track error:", err);
    return NextResponse.json({ ok: false, error: "Failed to track event" }, { status: 500 });
  }
}
