import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { client } from "@/src/sanity/lib/client";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { readPressKitImage } from "@/src/lib/prefill/pressKit";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** GET /api/v1/admin/program-images - List recent image assets */
export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

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

const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

/** Public http(s) URLs only: the admin should not be able to make the server fetch internal addresses. */
function isPublicHttpUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return null;
    if (/^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1\]?$|\[?f[cd])/.test(host)) return null;
    return url;
  } catch {
    return null;
  }
}

/** JSON body `{ url }`: download an image (e.g. from a prefill scrape) and upload it as an asset. */
async function importFromUrl(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { url?: unknown };

  // Press kit image: `presskit:<zip url>#<path in zip>` (from the prefill dialog).
  if (typeof body.url === "string" && body.url.startsWith("presskit:")) {
    const zipUrl = body.url.slice("presskit:".length).split("#")[0];
    if (!isPublicHttpUrl(zipUrl)) return Errors.validation("Press kit URL must be a public http(s) URL");
    const image = await readPressKitImage(body.url);
    if (!image) return Errors.validation("Image not found in the press kit");
    if (image.data.length > MAX_IMPORT_BYTES) return Errors.validation("Image is larger than 10 MB");
    const asset = await client.assets.upload("image", image.data, {
      filename: image.name.replace(/[^a-zA-Z0-9.-]/g, "_"),
      contentType: image.mime
    });
    return NextResponse.json({ data: { assetId: asset._id }, meta: {} }, { status: 201 });
  }

  const url = typeof body.url === "string" ? isPublicHttpUrl(body.url.trim()) : null;
  if (!url) return Errors.validation("url must be a public http(s) image URL");

  const res = await fetch(url, { signal: AbortSignal.timeout(15_000), headers: { "User-Agent": "Mozilla/5.0 KeyAway admin image import" } });
  if (!res.ok) return Errors.validation(`Image download failed (HTTP ${res.status})`);
  const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!ACCEPTED_TYPES.includes(type)) return Errors.validation(`Unsupported image type: ${type || "unknown"}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_IMPORT_BYTES) return Errors.validation("Image is larger than 10 MB");

  const name = url.pathname.split("/").pop() || "image";
  const asset = await client.assets.upload("image", buffer, { filename: name.replace(/[^a-zA-Z0-9.-]/g, "_"), contentType: type });
  return NextResponse.json({ data: { assetId: asset._id }, meta: {} }, { status: 201 });
}

/** POST /api/v1/admin/program-images - Upload an image file (multipart `file`) or import one by URL (JSON `{ url }`) */
export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    if (req.headers.get("content-type")?.includes("application/json")) return await importFromUrl(req);

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
