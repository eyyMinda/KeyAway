import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

const MAX_TITLE = 200;
const MAX_MESSAGE = 5000;
const MAX_NAME = 100;
const MAX_EMAIL = 254;

/** POST /api/v1/contact - Submit contact form */
export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  try {
    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== "object") return Errors.badRequest("Request body is required");

    const b = body as Record<string, unknown>;
    const title = typeof b.title === "string" ? b.title.trim() : "";
    const message = typeof b.message === "string" ? b.message.trim() : "";
    const name = typeof b.name === "string" ? b.name.trim() : "";
    const email = typeof b.email === "string" ? b.email.trim() : "";

    if (!title) return Errors.validation("Title is required", [{ field: "title", message: "Required" }]);
    if (!message) return Errors.validation("Message is required", [{ field: "message", message: "Required" }]);
    if (title.length > MAX_TITLE)
      return Errors.validation(`Title too long (max ${MAX_TITLE})`, [{ field: "title", message: "Too long" }]);
    if (message.length > MAX_MESSAGE)
      return Errors.validation(`Message too long (max ${MAX_MESSAGE})`, [{ field: "message", message: "Too long" }]);
    if (name && name.length > MAX_NAME)
      return Errors.validation(`Name too long (max ${MAX_NAME})`, [{ field: "name", message: "Too long" }]);
    if (email && email.length > MAX_EMAIL)
      return Errors.validation(`Email too long (max ${MAX_EMAIL})`, [{ field: "email", message: "Too long" }]);

    const result = await client.create({
      _type: "contactMessage",
      title,
      message,
      name: name || undefined,
      email: email || undefined,
      status: "new",
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ data: { id: result._id }, meta: {} }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/v1/contact]", err);
    return Errors.internal();
  }
}
