import { NextRequest } from "next/server";
import crypto from "crypto";

/** Extract client IP from request (x-forwarded-for, first hop). */
export function getClientIp(req: NextRequest | Request): string | undefined {
  return getClientIpFromForwardedHeaders(req.headers);
}

/** For RSC `headers()` / plain `Headers` (same logic as `getClientIp`). */
export function getClientIpFromForwardedHeaders(h: Headers): string | undefined {
  const xff = h.get("x-forwarded-for") || "";
  return xff.split(",")[0]?.trim() || undefined;
}

/** Hash IP with ANALYTICS_SALT for privacy-preserving visitor identification. */
export function hashIp(ip: string | undefined): string | undefined {
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

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

/**
 * Country and city Vercel attaches to the incoming function request.
 * Missing on localhost, and never shown in the browser Network tab.
 * Country is the English region name so it matches older ipapi rows (`Germany`, not `DE`).
 */
export function locationFromVercelHeaders(h: Headers): { country?: string; city?: string } | undefined {
  const code = h.get("x-vercel-ip-country")?.trim().toUpperCase();
  let country: string | undefined;
  if (code && /^[A-Z]{2}$/.test(code)) {
    try {
      country = regionNames.of(code) || undefined;
    } catch {
      country = undefined;
    }
  }

  const rawCity = h.get("x-vercel-ip-city")?.trim();
  let city: string | undefined;
  if (rawCity) {
    try {
      city = decodeURIComponent(rawCity).trim() || undefined;
    } catch {
      city = rawCity;
    }
  }

  if (!country && !city) return undefined;
  return { country, city };
}
