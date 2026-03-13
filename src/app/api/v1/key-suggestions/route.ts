import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

const MAX_FIELD = 500;
const MAX_MSG = 2000;

/** POST /api/v1/key-suggestions - Submit key suggestion */
export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  try {
    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== "object") return Errors.badRequest("Request body is required");

    const b = body as Record<string, unknown>;
    const cdKey = typeof b.cdKey === "string" ? b.cdKey.trim() : "";
    const programName = typeof b.programName === "string" ? b.programName.trim() : "";
    const programVersion = typeof b.programVersion === "string" ? b.programVersion.trim() : "";
    const programLink = typeof b.programLink === "string" ? b.programLink.trim() : "";
    const name = typeof b.name === "string" ? b.name.trim() : "";
    const email = typeof b.email === "string" ? b.email.trim() : "";
    const message = typeof b.message === "string" ? b.message.trim() : "";

    if (!cdKey) return Errors.validation("cdKey is required", [{ field: "cdKey", message: "Required" }]);
    if (!programName)
      return Errors.validation("programName is required", [{ field: "programName", message: "Required" }]);
    if (!programVersion)
      return Errors.validation("programVersion is required", [{ field: "programVersion", message: "Required" }]);
    if (!programLink)
      return Errors.validation("programLink is required", [{ field: "programLink", message: "Required" }]);

    if (cdKey.length > MAX_FIELD || programName.length > MAX_FIELD || programVersion.length > MAX_FIELD)
      return Errors.validation("Field too long");

    const result = await client.create({
      _type: "keySuggestion",
      cdKey,
      programName,
      programVersion,
      programLink,
      name: name || undefined,
      email: email || undefined,
      message: message.length > MAX_MSG ? message.slice(0, MAX_MSG) : message || undefined,
      status: "new",
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ data: { id: result._id }, meta: {} }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/v1/key-suggestions]", err);
    return Errors.internal();
  }
}
