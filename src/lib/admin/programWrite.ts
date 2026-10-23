/** @fileoverview Server helpers shared by the admin program create/update routes. */
import { revalidateAfterProgramContentWrite } from "@/src/lib/cache/revalidateProgramContent";
import { rebuildSiteNotificationFeed } from "@/src/lib/notifications/notificationFeed.server";
import { mutationClient } from "@/src/lib/sanity/mutationClient";
import { adminProgramEditorQuery, adminProgramListProjection } from "@/src/lib/sanity/queries";
import { buildSiteUrl, submitIndexNow } from "@/src/lib/seo/indexnow";
import { EDITABLE_PROGRAM_FIELDS, type ProgramFields } from "@/src/lib/admin/programFields";
import type { AdminProgramDoc, AdminProgramRow } from "@/src/types/admin";

export async function fetchProgramEditorDoc(id: string): Promise<AdminProgramDoc | null> {
  return mutationClient.fetch<AdminProgramDoc | null>(adminProgramEditorQuery, { id });
}

/** Fresh editor doc + list row after a write (dataset API, never the CDN). */
export async function fetchProgramWriteResult(id: string): Promise<{ doc: AdminProgramDoc | null; row: AdminProgramRow | null }> {
  const [doc, row] = await Promise.all([
    fetchProgramEditorDoc(id),
    mutationClient.fetch<AdminProgramRow | null>(`*[_type == "program" && _id == $id][0]${adminProgramListProjection}`, {
      id
    })
  ]);
  return { doc, row };
}

/** The editable part of a stored program, for validating it merged with a partial update. */
export function editableFieldsOf(doc: AdminProgramDoc): ProgramFields {
  return Object.fromEntries(EDITABLE_PROGRAM_FIELDS.map(f => [f, doc[f]])) as ProgramFields;
}

export async function slugTakenByOtherProgram(slug: string, exceptId?: string): Promise<boolean> {
  const id = await mutationClient.fetch<string | null>(
    `*[_type == "program" && slug.current == $slug && _id != $exceptId && !(_id in path("drafts.**"))][0]._id`,
    { slug, exceptId: exceptId ?? "" }
  );
  return !!id;
}

/** Cache tags, the site notification feed and IndexNow, as after any program content write. */
export async function afterProgramWrite(opts: { slug?: string; previousSlug?: string; sitemapChanged?: boolean }): Promise<void> {
  const { slug, previousSlug, sitemapChanged } = opts;
  const renamed = !!previousSlug && previousSlug !== slug;
  revalidateAfterProgramContentWrite({
    slug,
    previousSlug: renamed ? previousSlug : undefined,
    invalidateSitemap: sitemapChanged || renamed
  });
  await rebuildSiteNotificationFeed();
  const urls = [buildSiteUrl("/programs"), buildSiteUrl("/")];
  if (slug) urls.unshift(buildSiteUrl(`/program/${slug}`));
  if (renamed) urls.push(buildSiteUrl(`/program/${previousSlug}`));
  void submitIndexNow(urls);
}
