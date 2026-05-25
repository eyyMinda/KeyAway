import { getClientIp } from "./requestGeo";

const store = new Map<string, { count: number; resetAt: number }>();

/** Global comment posts per IP (all programs). */
const GLOBAL_WINDOW_MS = 15 * 60_000;
const GLOBAL_MAX = 8;

/** Per-program comment posts per IP. */
const PROGRAM_WINDOW_MS = 5 * 60_000;
const PROGRAM_MAX = 3;

function checkScoped(key: string, max: number, windowMs: number): { ok: boolean } {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  entry.count++;
  return { ok: entry.count <= max };
}

export function checkCommentRateLimit(req: Request, programSlug: string): { ok: boolean; reason?: string } {
  const ip = getClientIp(req) ?? "anonymous";
  const globalKey = `comment:global:${ip}`;
  const programKey = `comment:program:${ip}:${programSlug}`;

  if (!checkScoped(globalKey, GLOBAL_MAX, GLOBAL_WINDOW_MS).ok) {
    return { ok: false, reason: "Too many comments. Wait a few minutes and try again." };
  }
  if (!checkScoped(programKey, PROGRAM_MAX, PROGRAM_WINDOW_MS).ok) {
    return { ok: false, reason: "Too many comments on this program. Please wait before posting again." };
  }
  return { ok: true };
}
