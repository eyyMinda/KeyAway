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

const DEFAULT_SPEED_INSIGHTS_SAMPLE_RATE = 0.15;

export function resolveSpeedInsightsSampleRate(): number {
  const raw = process.env.NEXT_PUBLIC_SPEED_INSIGHTS_SAMPLE_RATE;
  if (raw == null || raw.trim() === "") return DEFAULT_SPEED_INSIGHTS_SAMPLE_RATE;

  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_SPEED_INSIGHTS_SAMPLE_RATE;
  if (parsed >= 1) return 1;
  return parsed;
}
