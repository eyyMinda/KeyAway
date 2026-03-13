import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { Errors } from "@/src/lib/api/errors";

/** POST /api/v1/webhooks/revalidate - Sanity webhook: revalidate cache tags */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const secret = req.headers.get("sanity-webhook-secret");
    const bodySecret = body?.secret;

    const expected = process.env.SANITY_WEBHOOK_SECRET;
    if (expected && secret !== expected && bodySecret !== expected) {
      return Errors.unauthorized("Invalid webhook secret");
    }

    revalidateTag("homepage", "max");
    revalidateTag("notifications", "max");

    if (body?._type === "program" && body?.slug?.current) {
      revalidateTag(`program-${body.slug.current}`, "max");
    }
    if (body?._type === "program" || body?._type === "cdKey") {
      revalidateTag("programs", "max");
    }

    return NextResponse.json({ data: { revalidated: true }, meta: {} });
  } catch (err) {
    console.error("[POST /api/v1/webhooks/revalidate]", err);
    return Errors.internal();
  }
}
