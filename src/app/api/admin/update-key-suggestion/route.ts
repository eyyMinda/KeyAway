import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";

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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const suggestionId = typeof body.suggestionId === "string" ? body.suggestionId.trim() : "";
    if (!suggestionId) {
      return NextResponse.json({ error: "suggestionId is required" }, { status: 400 });
    }

    const updates = parseUpdates(body);
    const keys = Object.keys(updates) as (keyof typeof updates)[];
    if (keys.length === 0) {
      return NextResponse.json({ error: "No valid fields to update (allowed: status, email, name)" }, { status: 400 });
    }

    const patch = client.patch(suggestionId);
    for (const key of keys) {
      const v = updates[key];
      patch.set({ [key]: v ?? null });
    }
    const result = await patch.commit();

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update key suggestion";
    const statusCode = message.includes("required") || message.includes("must be") ? 400 : 500;
    if (statusCode === 500) {
      console.error("Error updating key suggestion:", error);
    }
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
