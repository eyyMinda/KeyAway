import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { client } from "@/src/sanity/lib/client";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { listKeyReportsForAdmin } from "@/src/lib/analytics/keyReportStore";

const VALID_STATUSES = ["new", "active", "expired", "limit"] as const;
const MAX_KEY_UPDATES = 200;
const KEY_ID_RE = /^[\w-]{1,64}$/;

/** GET /api/v1/admin/key-reports - Every key report, newest first (admin table). */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const rows = await listKeyReportsForAdmin();
    return NextResponse.json({ data: rows, meta: { count: rows.length } });
  } catch (err) {
    console.error("[GET /api/v1/admin/key-reports]", err);
    return Errors.internal();
  }
}

type KeyStatusUpdate = { programSlug: string; keyId: string; newStatus: string };

function parseUpdates(value: unknown): KeyStatusUpdate[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_KEY_UPDATES) return null;
  const updates: KeyStatusUpdate[] = [];
  for (const item of value) {
    const u = (item ?? {}) as Record<string, unknown>;
    const programSlug = typeof u.programSlug === "string" ? u.programSlug.trim() : "";
    const keyId = typeof u.keyId === "string" ? u.keyId.trim() : "";
    const newStatus = typeof u.newStatus === "string" ? u.newStatus.trim() : "";
    if (!programSlug || !KEY_ID_RE.test(keyId) || !VALID_STATUSES.includes(newStatus as (typeof VALID_STATUSES)[number])) {
      return null;
    }
    updates.push({ programSlug, keyId, newStatus });
  }
  return updates;
}

/**
 * PATCH /api/v1/admin/key-reports - Set the status of one or more activation rows by array `_key`.
 * Each row is patched on its own path, so a stale read can never write older keys back over a program.
 */
export async function PATCH(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const body = (await req.json().catch(() => ({}))) as { updates?: unknown };
    const updates = parseUpdates(body?.updates);
    if (!updates) return Errors.validation(`updates must list 1 to ${MAX_KEY_UPDATES} { programSlug, keyId, newStatus } rows`);

    const slugs = [...new Set(updates.map(u => u.programSlug))];
    const programs = await client
      .withConfig({ useCdn: false })
      .fetch<Array<{ _id: string; slug: string; keyIds: string[] | null }>>(
        `*[_type == "program" && slug.current in $slugs]{ _id, "slug": slug.current, "keyIds": cdKeys[]._key }`,
        { slugs }
      );

    const bySlug = new Map(programs.map(p => [p.slug, p]));
    const transaction = client.transaction();
    for (const update of updates) {
      const program = bySlug.get(update.programSlug);
      if (!program) return Errors.notFound(`Program not found for slug: ${update.programSlug}`);
      if (!program.keyIds?.includes(update.keyId)) return Errors.notFound(`Key not found in ${update.programSlug}`);
      transaction.patch(program._id, patch => patch.set({ [`cdKeys[_key=="${update.keyId}"].status`]: update.newStatus }));
    }
    await transaction.commit();

    return NextResponse.json({ data: { updated: updates.length }, meta: {} });
  } catch (err) {
    console.error("[PATCH /api/v1/admin/key-reports]", err);
    return Errors.internal();
  }
}
