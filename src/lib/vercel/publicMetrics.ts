/** Accepts a pathname (`/programs`) or full URL from Vercel `beforeSend`. */
export function shouldTrackPublicVercelMetrics(pathOrUrl: string): boolean {
  let pathname: string;
  if (pathOrUrl.startsWith("/")) {
    pathname = pathOrUrl;
  } else {
    try {
      pathname = new URL(pathOrUrl).pathname;
    } catch {
      return false;
    }
  }

  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/studio")) return false;
  if (pathname.startsWith("/api")) return false;
  return true;
}

/** Only bill RUM on the live production deployment (not preview or local). */
export function isVercelProductionDeployment(): boolean {
  return process.env.NEXT_PUBLIC_VERCEL_ENV === "production";
}

/** Web Analytics is off unless `NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED=true` (own event tracking covers it). */
export function isVercelAnalyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED === "true";
}
