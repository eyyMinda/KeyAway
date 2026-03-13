import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/src/lib/admin/adminAuth";
import { client } from "@/src/sanity/lib/client";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** GET /api/v1/admin/program-images - List recent image assets */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const { isAdmin } = await checkAdminAccess();
  if (!isAdmin) return Errors.unauthorized();

  try {
    const assets = await client.fetch<{ _id: string }[]>(
      `*[_type == "sanity.imageAsset"] | order(_updatedAt desc)[0...60]{ _id }`
    );
    return NextResponse.json({ data: { assets: assets ?? [] }, meta: {} });
  } catch (err) {
    console.error("[GET /api/v1/admin/program-images]", err);
    return Errors.internal();
  }
}

/** POST /api/v1/admin/program-images - Upload image asset */
export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const { isAdmin } = await checkAdminAccess();
  if (!isAdmin) return Errors.unauthorized();

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return Errors.badRequest("file is required");
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return Errors.validation("Invalid file type. Use JPEG, PNG, WebP, or GIF.", [
        { field: "file", message: "Invalid type" }
      ]);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await client.assets.upload("image", buffer, {
      filename: file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    });
    return NextResponse.json({ data: { assetId: asset._id }, meta: {} }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/v1/admin/program-images]", err);
    return Errors.internal();
  }
}
