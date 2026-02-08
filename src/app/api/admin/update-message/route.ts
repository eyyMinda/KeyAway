import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";

const VALID_STATUSES = ["new", "read", "replied", "archived"] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Allowed update fields and validation. Returns only whitelisted, validated fields. */
function parseUpdates(body: unknown): { status?: string; email?: string; name?: string } {
  if (!body || typeof body !== "object") {
    return {};
  }
  const out: { status?: string; email?: string; name?: string } = {};
  const b = body as Record<string, unknown>;

  if (b.status !== undefined) {
    if (typeof b.status !== "string" || !VALID_STATUSES.includes(b.status as (typeof VALID_STATUSES)[number])) {
      throw new Error(`status must be one of: ${VALID_STATUSES.join(", ")}`);
    }
    out.status = b.status;
  }

  if (b.email !== undefined) {
    const email = typeof b.email === "string" ? b.email.trim() : "";
    if (email && !EMAIL_REGEX.test(email)) {
      throw new Error("email must be a valid email address");
    }
    out.email = email || undefined;
  }

  if (b.name !== undefined) {
    out.name = typeof b.name === "string" ? b.name.trim() || undefined : undefined;
  }

  return out;
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const messageId = typeof body.messageId === "string" ? body.messageId.trim() : "";
    if (!messageId) {
      return NextResponse.json({ error: "messageId is required" }, { status: 400 });
    }

    const updates = parseUpdates(body);
    const keys = Object.keys(updates) as (keyof typeof updates)[];
    if (keys.length === 0) {
      return NextResponse.json({ error: "No valid fields to update (allowed: status, email, name)" }, { status: 400 });
    }

    const patch = client.patch(messageId);
    for (const key of keys) {
      const v = updates[key];
      patch.set({ [key]: v ?? null });
    }
    const result = await patch.commit();

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update message";
    const status = message.includes("required") || message.includes("must be") ? 400 : 500;
    if (status === 500) {
      console.error("Error updating message:", error);
    }
    return NextResponse.json({ error: message }, { status });
  }
}
