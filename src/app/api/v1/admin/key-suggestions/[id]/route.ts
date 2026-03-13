import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/src/lib/admin/adminAuth";
import { client } from "@/src/sanity/lib/client";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

const VALID_STATUSES = ["new", "reviewing", "added", "rejected"] as const;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseUpdates(body: unknown): { status?: string; email?: string; name?: string } {
  if (!body || typeof body !== "object") return {};
  const b = body as Record<string, unknown>;
  const out: { status?: string; email?: string; name?: string } = {};

  if (
    b.status !== undefined &&
    typeof b.status === "string" &&
    VALID_STATUSES.includes(b.status as (typeof VALID_STATUSES)[number])
  ) {
    out.status = b.status;
  }
  if (b.email !== undefined) {
    const email = typeof b.email === "string" ? b.email.trim() : "";
    if (email && !EMAIL_REGEX.test(email)) throw new Error("email must be a valid email address");
    out.email = email || undefined;
  }
  if (b.name !== undefined) {
    out.name = typeof b.name === "string" ? b.name.trim() || undefined : undefined;
  }
  return out;
}

/** PATCH /api/v1/admin/key-suggestions/[id] - Update key suggestion */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const { isAdmin } = await checkAdminAccess();
  if (!isAdmin) return Errors.unauthorized();

  try {
    const { id } = await params;
    if (!id) return Errors.badRequest("id is required");

    const body = await req.json().catch(() => ({}));
    const updates = parseUpdates(body);
    const keys = Object.keys(updates);
    if (keys.length === 0) {
      return Errors.validation("No valid fields to update (allowed: status, email, name)");
    }

    const patch = client.patch(id);
    for (const key of keys) {
      const v = updates[key as keyof typeof updates];
      patch.set({ [key]: v ?? null });
    }
    const result = await patch.commit();

    return NextResponse.json({ data: result, meta: {} });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update key suggestion";
    if (message.includes("required") || message.includes("must be")) {
      return Errors.validation(message);
    }
    console.error("[PATCH /api/v1/admin/key-suggestions/[id]]", err);
    return Errors.internal();
  }
}
