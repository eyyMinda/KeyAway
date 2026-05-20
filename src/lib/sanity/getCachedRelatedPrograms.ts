import { unstable_cache } from "next/cache";
import { TAG_PROGRAM_LISTINGS } from "@/src/lib/cache/cacheTags";
import { PUBLIC_ISR_REVALIDATE_SECONDS } from "@/src/lib/cache/constants";
import { client } from "@/src/sanity/lib/client";
import { popularProgramsQuery } from "@/src/lib/sanity/queries";
import type { Program } from "@/src/types/program";

/** Shared related-program pool (filtered per slug on the program page). */
export const getCachedRelatedPrograms = unstable_cache(
  async (): Promise<Program[]> => {
    const rows = await client.fetch<Program[]>(popularProgramsQuery, {}, { next: { tags: [TAG_PROGRAM_LISTINGS] } });
    return rows ?? [];
  },
  ["related-programs-pool"],
  { revalidate: PUBLIC_ISR_REVALIDATE_SECONDS, tags: [TAG_PROGRAM_LISTINGS] }
);
