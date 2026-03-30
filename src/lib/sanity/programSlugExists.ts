/** @fileoverview Sanity: check slug exists on a published program (track API clears slug when invalid). */
import { client } from "@/src/sanity/lib/client";

/** True if a published program uses this slug (for stripping bogus `programSlug` from analytics). */
export async function isProgramSlugPublished(slug: string | undefined): Promise<boolean> {
  const s = slug?.trim();
  if (!s) return false;
  const id = await client.fetch<string | null>(`*[_type == "program" && slug.current == $slug][0]._id`, { slug: s });
  return Boolean(id);
}
