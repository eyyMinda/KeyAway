/** @fileoverview API route for updating and deleting individual programs. Handles PATCH and DELETE operations with validation. */

import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";
import { buildImageReference } from "@/src/lib/adminHelpers";

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

function parseBody(body: unknown): {
  title?: string;
  slug?: string;
  description?: string;
  featuredDescription?: string;
  downloadLink?: string;
  imageAssetId?: string | null;
  showcaseGifAssetId?: string | null;
} {
  if (!body || typeof body !== "object") return {};
  const b = body as Record<string, unknown>;
  const out: {
    title?: string;
    slug?: string;
    description?: string;
    featuredDescription?: string;
    downloadLink?: string;
    imageAssetId?: string | null;
    showcaseGifAssetId?: string | null;
  } = {};

  if (b.title !== undefined) {
    const v = typeof b.title === "string" ? b.title.trim() : "";
    if (!v) throw new Error("title cannot be empty");
    out.title = v;
  }
  if (b.slug !== undefined) {
    const raw = typeof b.slug === "string" ? b.slug.trim() : "";
    if (!raw) throw new Error("slug cannot be empty");
    const slug = normalizeSlug(raw);
    if (!SLUG_REGEX.test(slug)) throw new Error("slug must contain only lowercase letters, numbers, and hyphens");
    out.slug = slug;
  }
  if (b.description !== undefined) {
    out.description = typeof b.description === "string" ? b.description.trim() : "";
  }
  if (b.featuredDescription !== undefined) {
    out.featuredDescription = typeof b.featuredDescription === "string" ? b.featuredDescription.trim() : undefined;
  }
  if (b.downloadLink !== undefined) {
    const v = typeof b.downloadLink === "string" ? b.downloadLink.trim() : "";
    if (v && !URL_REGEX.test(v)) throw new Error("downloadLink must be a valid URL");
    out.downloadLink = v || undefined;
  }
  if (b.imageAssetId !== undefined) {
    out.imageAssetId =
      b.imageAssetId === null || b.imageAssetId === ""
        ? null
        : typeof b.imageAssetId === "string"
          ? b.imageAssetId.trim() || null
          : undefined;
  }
  if (b.showcaseGifAssetId !== undefined) {
    out.showcaseGifAssetId =
      b.showcaseGifAssetId === null || b.showcaseGifAssetId === ""
        ? null
        : typeof b.showcaseGifAssetId === "string"
          ? b.showcaseGifAssetId.trim() || null
          : undefined;
  }
  return out;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const updates = parseBody(body);
    const keys = Object.keys(updates) as (keyof typeof updates)[];
    if (keys.length === 0) {
      return NextResponse.json(
        {
          error:
            "No valid fields to update (allowed: title, slug, description, featuredDescription, downloadLink, imageAssetId, showcaseGifAssetId)"
        },
        { status: 400 }
      );
    }

    if (updates.slug) {
      const duplicate = await client.fetch<string | null>(
        `*[_type == "program" && slug.current == $slug && _id != $id][0]._id`,
        { slug: updates.slug, id }
      );
      if (duplicate) {
        return NextResponse.json({ error: "Another program already uses this slug" }, { status: 400 });
      }
    }

    const patch = client.patch(id);
    if (updates.title !== undefined) patch.set({ title: updates.title });
    if (updates.slug !== undefined) patch.set({ slug: { _type: "slug", current: updates.slug } });
    if (updates.description !== undefined) patch.set({ description: updates.description });
    if (updates.featuredDescription !== undefined)
      patch.set({ featuredDescription: updates.featuredDescription ?? null });
    if (updates.downloadLink !== undefined) patch.set({ downloadLink: updates.downloadLink ?? null });
    if (updates.imageAssetId !== undefined) {
      patch.set({ image: buildImageReference(updates.imageAssetId) });
    }
    if (updates.showcaseGifAssetId !== undefined) {
      patch.set({ showcaseGif: buildImageReference(updates.showcaseGifAssetId) });
    }

    const result = await patch.commit();
    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update program";
    const status =
      message.includes("cannot be empty") || message.includes("must be") || message.includes("already") ? 400 : 500;
    if (status === 500) console.error("Error updating program:", error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const existing = await client.fetch<{ _id: string } | null>(`*[_type == "program" && _id == $id][0]{ _id }`, {
      id
    });
    if (!existing) return NextResponse.json({ error: "Program not found" }, { status: 404 });

    await client.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting program:", error);
    return NextResponse.json({ error: "Failed to delete program" }, { status: 500 });
  }
}
