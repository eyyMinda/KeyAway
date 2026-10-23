/** @fileoverview Server helpers shared by the admin vendor create/update/delete routes. */
import { revalidatePath, revalidateTag } from "next/cache";
import { TAG_PROGRAM_LISTINGS, TAG_SITEMAP_URLS, TAG_VENDORS } from "@/src/lib/cache/cacheTags";
import { mutationClient } from "@/src/lib/sanity/mutationClient";
import { adminVendorEditorQuery, adminVendorListProjection } from "@/src/lib/sanity/queries";
import { EDITABLE_VENDOR_FIELDS, type VendorFields } from "@/src/lib/admin/vendorFields";
import type { AdminVendorDoc, AdminVendorRow } from "@/src/types/admin";

export async function fetchVendorEditorDoc(id: string): Promise<AdminVendorDoc | null> {
  return mutationClient.fetch<AdminVendorDoc | null>(adminVendorEditorQuery, { id });
}

export async function fetchVendorWriteResult(id: string): Promise<{ doc: AdminVendorDoc | null; row: AdminVendorRow | null }> {
  const [doc, row] = await Promise.all([
    fetchVendorEditorDoc(id),
    mutationClient.fetch<AdminVendorRow | null>(`*[_type == "vendor" && _id == $id][0]${adminVendorListProjection}`, { id })
  ]);
  return { doc, row };
}

export function editableVendorFieldsOf(doc: AdminVendorDoc): VendorFields {
  return Object.fromEntries(EDITABLE_VENDOR_FIELDS.map(f => [f, doc[f]])) as VendorFields;
}

export async function vendorSlugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const id = await mutationClient.fetch<string | null>(
    `*[_type == "vendor" && slug.current == $slug && _id != $exceptId && !(_id in path("drafts.**"))][0]._id`,
    { slug, exceptId: exceptId ?? "" }
  );
  return !!id;
}

/** Same tags the Sanity webhook busts for vendor edits: hub pages, program-card brand labels, sitemap. */
export function afterVendorWrite(): void {
  revalidateTag(TAG_VENDORS, "max");
  revalidateTag(TAG_PROGRAM_LISTINGS, "max");
  revalidateTag(TAG_SITEMAP_URLS, "max");
  revalidatePath("/sitemap.xml");
}
