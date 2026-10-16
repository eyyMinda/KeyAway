import { cache } from "react";
import { programDetailTag } from "@/src/lib/cache/cacheTags";
import { queryShareCounts } from "@/src/lib/share/queryShareCounts";
import type { ShareCounts } from "@/src/lib/share/buildSharePayload";

export type ProgramShareCounts = ShareCounts;

/** Aggregate share-click counts per network for a program from session events. */
export const getProgramShareCounts = cache(
  (slug: string): Promise<ProgramShareCounts> => queryShareCounts({ programSlug: slug }, programDetailTag(slug))
);
