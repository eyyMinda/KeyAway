import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { MAX_REPLY_BODY_LENGTH, ReplySendError, sendContactMessageReply } from "@/src/lib/email/sendContactMessageReply";

/** POST /api/v1/admin/messages/[id]/reply - Send HTML reply via Resend */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const { id } = await params;
    if (!id) return Errors.badRequest("id is required");

    const body = await req.json().catch(() => ({}));
    const replyText = typeof (body as { replyText?: unknown }).replyText === "string" ? body.replyText : "";

    if (!replyText.trim()) {
      return Errors.validation("Reply text is required", [{ field: "replyText", message: "Required" }]);
    }
    if (replyText.length > MAX_REPLY_BODY_LENGTH) {
      return Errors.validation(`Reply too long (max ${MAX_REPLY_BODY_LENGTH})`, [
        { field: "replyText", message: "Too long" }
      ]);
    }

    const result = await sendContactMessageReply({
      messageId: id,
      replyText,
      adminEmail: admin.email
    });

    return NextResponse.json({ data: result, meta: {} }, { status: 201 });
  } catch (err) {
    if (err instanceof ReplySendError) {
      if (err.code === "NOT_CONFIGURED") {
        return Errors.serviceUnavailable(err.message, "RESEND_NOT_CONFIGURED");
      }
      if (err.code === "NOT_FOUND") return Errors.notFound(err.message);
      if (err.code === "NO_EMAIL") return Errors.validation(err.message, [{ field: "email", message: "Required" }]);
      return Errors.validation(err.message);
    }

    console.error("[POST /api/v1/admin/messages/[id]/reply]", err);
    return Errors.internal();
  }
}
