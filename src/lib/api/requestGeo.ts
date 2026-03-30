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

const locationCache = new Map<string, { data: { country?: string; city?: string }; expires: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of locationCache.entries()) {
    if (entry.expires <= now) locationCache.delete(ip);
  }
}, CLEANUP_INTERVAL_MS);

const GEO_SERVICES = [
  {
    url: (ip: string) => `https://ipapi.co/${ip}/json/`,
    parser: (data: Record<string, unknown>) => ({ country: data.country_name as string, city: data.city as string })
  },
  {
    url: (ip: string) => `https://ip-api.com/json/${ip}`,
    parser: (data: Record<string, unknown>) => ({ country: data.country as string, city: data.city as string })
  },
  {
    url: (ip: string) => `https://ipinfo.io/${ip}/json`,
    parser: (data: Record<string, unknown>) => ({ country: data.country as string, city: data.city as string })
  }
];

/** Resolve country/city from IP. Cached 1h per IP. */
export async function getLocationFromIP(
  ip: string | undefined,
  userAgent = "KeyAway"
): Promise<{ country?: string; city?: string } | undefined> {
  if (!ip) return undefined;
  const cached = locationCache.get(ip);
  if (cached && cached.expires > Date.now()) return cached.data;

  for (const service of GEO_SERVICES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(service.url(ip), {
        headers: { "User-Agent": userAgent },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        const result = service.parser(data);
        if (result.country || result.city) {
          locationCache.set(ip, { data: result, expires: Date.now() + CACHE_TTL_MS });
          return result;
        }
      }
    } catch {
      continue;
    }
  }
  return undefined;
}
