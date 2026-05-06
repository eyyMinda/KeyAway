import { revalidatePath, revalidateTag } from "next/cache";
import {
  TAG_FEATURED_PROGRAM,
  TAG_HOMEPAGE_PROGRAMS,
  TAG_HOMEPAGE_STATS,
  TAG_NOTIFICATIONS,
  TAG_PROGRAM_LISTINGS,
  TAG_PROGRAMS_FULL,
  TAG_SITEMAP_URLS,
  programDetailTag
} from "@/src/lib/cache/cacheTags";

type ProgramWriteOpts = {
  /** Program `slug.current` after create/update. */
  slug?: string;
  /** When slug changed, bust cache for the old program URL. */
  previousSlug?: string;
  /** When true, sitemap URL set or slug list changed (create, delete, slug rename). */
  invalidateSitemap?: boolean;
};

/**
 * After admin writes to Sanity programs: bust listing + detail caches.
 * Sitemap / slug inventory only when URL set changes (`invalidateSitemap`).
 */
export function revalidateAfterProgramContentWrite(opts: ProgramWriteOpts = {}): void {
  const { slug, previousSlug, invalidateSitemap } = opts;
  revalidateTag(TAG_PROGRAMS_FULL, "max");
  revalidateTag(TAG_NOTIFICATIONS, "max");
  revalidateTag(TAG_PROGRAM_LISTINGS, "max");
  revalidateTag(TAG_HOMEPAGE_PROGRAMS, "max");
  revalidateTag(TAG_HOMEPAGE_STATS, "max");
  revalidateTag(TAG_FEATURED_PROGRAM, "max");
  if (slug) revalidateTag(programDetailTag(slug), "max");
  if (previousSlug && previousSlug !== slug) revalidateTag(programDetailTag(previousSlug), "max");
  if (invalidateSitemap) {
    revalidateTag(TAG_SITEMAP_URLS, "max");
    revalidatePath("/sitemap.xml");
  }
  revalidatePath("/api/v1/notifications/recent");
}
