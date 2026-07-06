import { cache } from "react";
import { TAG_PROGRAM_LISTINGS, TAG_VENDORS } from "@/src/lib/cache/cacheTags";
import { client } from "@/src/sanity/lib/client";
import { vendorBySlugQuery, vendorSlugsQuery, vendorsWithCountsQuery } from "@/src/lib/sanity/queries";
import { mergeProgramStats } from "@/src/lib/analytics/eventsApi";
import type { ProgramWithStats } from "@/src/types/home";
import type { FreeVsProRow } from "@/src/types/program";
import type { PortableTextBlock } from "@portabletext/types";
import type { SanityImageField } from "@/src/types/program";

const VENDOR_TAGS = { next: { tags: [TAG_VENDORS, TAG_PROGRAM_LISTINGS] } };

export interface VendorListItem {
  _id: string;
  name: string;
  slug: string;
  logo?: SanityImageField;
  programCount: number;
}

export interface VendorHub {
  _id: string;
  name: string;
  slug: string;
  description?: PortableTextBlock[] | string | null;
  logo?: SanityImageField;
  seo?: { metaTitle?: string; metaDescription?: string };
  freeVsProDefaults?: FreeVsProRow[] | null;
  programs: ProgramWithStats[];
}

/** All vendors that have at least one program, with counts. Popularity/name sorted. */
export const getCachedVendorsWithCounts = cache(async (): Promise<VendorListItem[]> => {
  const rows = await client.fetch<VendorListItem[]>(vendorsWithCountsQuery, {}, VENDOR_TAGS);
  return rows ?? [];
});

/** Slugs of vendors worth indexing (have programs) — for generateStaticParams + sitemap. */
export const getCachedVendorSlugs = cache(async (): Promise<string[]> => {
  const rows = await client.fetch<{ slug: string }[]>(vendorSlugsQuery, {}, VENDOR_TAGS);
  return (rows ?? []).map(r => r.slug).filter(Boolean);
});

/** A single vendor hub with its programs (stats merged), or null. */
export const getVendorBySlug = cache(async (slug: string): Promise<VendorHub | null> => {
  const vendor = await client.fetch<VendorHub | null>(vendorBySlugQuery, { slug }, VENDOR_TAGS);
  if (!vendor) return null;
  return {
    ...vendor,
    programs: mergeProgramStats((vendor.programs ?? []) as ProgramWithStats[])
  };
});
