import { getClientIp } from "./requestGeo";

/** Simple in-memory rate limiter. Use Redis for multi-instance. */
const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000; // 1 min
const MAX_REQUESTS = 60;

export function checkRateLimit(identifier: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  let entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + WINDOW_MS };
    store.set(identifier, entry);
    return { ok: true, remaining: MAX_REQUESTS - 1 };
  }

  entry.count++;
  const remaining = Math.max(0, MAX_REQUESTS - entry.count);
  return { ok: entry.count <= MAX_REQUESTS, remaining };
}

export function rateLimitMiddleware(req: Request): { ok: boolean; remaining: number } {
  const id = getClientIp(req) ?? "anonymous";
  return checkRateLimit(id);
}
