import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";

const SLUG_REGEX = /^[a-z0-9-]+$/;
const URL_REGEX = /^https?:\/\/[^\s]+$/;

function normalizeSlug(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }
    const b = body as Record<string, unknown>;

    const title = typeof b.title === "string" ? b.title.trim() : "";
    if (!title) return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });

    const slugRaw = typeof b.slug === "string" ? b.slug.trim() : "";
    if (!slugRaw) return NextResponse.json({ error: "slug cannot be empty" }, { status: 400 });
    const slug = normalizeSlug(slugRaw);
    if (!SLUG_REGEX.test(slug)) {
      return NextResponse.json(
        { error: "slug must contain only lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    const description = typeof b.description === "string" ? b.description.trim() : "";
    if (!description) return NextResponse.json({ error: "description cannot be empty" }, { status: 400 });

    const downloadLinkRaw = typeof b.downloadLink === "string" ? b.downloadLink.trim() : "";
    if (downloadLinkRaw && !URL_REGEX.test(downloadLinkRaw)) {
      return NextResponse.json({ error: "downloadLink must be a valid URL" }, { status: 400 });
    }
    const downloadLink = downloadLinkRaw || undefined;

    const imageAssetId =
      b.imageAssetId === null || b.imageAssetId === ""
        ? undefined
        : typeof b.imageAssetId === "string"
          ? b.imageAssetId.trim() || undefined
          : undefined;

    const duplicate = await client.fetch<string | null>(`*[_type == "program" && slug.current == $slug][0]._id`, {
      slug
    });
    if (duplicate) {
      return NextResponse.json({ error: "A program with this slug already exists" }, { status: 400 });
    }

    const doc = await client.create({
      _type: "program",
      title,
      slug: { _type: "slug", current: slug },
      description,
      ...(downloadLink && { downloadLink }),
      ...(imageAssetId && {
        image: { _type: "image", asset: { _type: "reference", _ref: imageAssetId } }
      }),
      cdKeys: []
    });

    return NextResponse.json({ success: true, result: doc }, { status: 201 });
  } catch (error) {
    console.error("Error creating program:", error);
    const message = error instanceof Error ? error.message : "Failed to create program";
    const status =
      message.includes("cannot be empty") || message.includes("must be") || message.includes("already") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
