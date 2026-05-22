/** @fileoverview Resolve visitor fields from live `visitor` docs or archived `visitorBundle` rows. */
import { client } from "@/src/sanity/lib/client";

export type ResolvedVisitor = {
  source: "live" | "archived";
  _id?: string;
  visitorHash: string;
  visitTier?: string;
  isSpammer?: boolean;
  visitCount?: number;
  reportCount?: number;
  suggestionCount?: number;
  contributionScore?: number;
  country?: string;
  city?: string;
  lastActivityAt?: string;
};

type LiveRow = Omit<ResolvedVisitor, "source" | "visitorHash"> & { visitorHash?: string };
type ArchivedRow = Omit<ResolvedVisitor, "source" | "visitorHash"> & { visitorHash?: string };

function pickLive(row: LiveRow | null | undefined, hash: string): ResolvedVisitor | null {
  if (!row?.visitorHash) return null;
  return { source: "live", ...row, visitorHash: hash };
}

function pickArchived(rows: ArchivedRow[] | null | undefined, hash: string): ResolvedVisitor | null {
  const sorted = [...(rows ?? [])].sort((a, b) => {
    const ta = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
    const tb = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
    return tb - ta;
  });
  const best = sorted.find(r => r.visitorHash === hash);
  if (!best?.visitorHash) return null;
  return { source: "archived", ...best, visitorHash: hash };
}

/** Latest live or archived visitor for a hash (live wins). */
export async function fetchVisitorByHash(visitorHash: string): Promise<ResolvedVisitor | null> {
  const { live, archived } = await client.fetch<{
    live?: LiveRow | null;
    archived?: ArchivedRow[];
  }>(
    `{
      "live": *[_type == "visitor" && visitorHash == $h][0]{
        _id, visitorHash, isSpammer, visitTier, visitCount, reportCount, suggestionCount, contributionScore, country, city, lastActivityAt
      },
      "archived": *[_type == "visitorBundle"].visitors[visitorHash == $h]{
        visitorHash, isSpammer, visitTier, visitCount, reportCount, suggestionCount, contributionScore, country, city, lastActivityAt
      }
    }`,
    { h: visitorHash }
  );
  return pickLive(live, visitorHash) ?? pickArchived(archived, visitorHash);
}

/** Batch resolve visitors by hash (live wins per hash). */
export async function fetchVisitorsByHashes(
  hashes: string[]
): Promise<Map<string, ResolvedVisitor>> {
  const unique = [...new Set(hashes.filter(Boolean))];
  if (!unique.length) return new Map();

  const { live, archived } = await client.fetch<{
    live?: LiveRow[];
    archived?: ArchivedRow[];
  }>(
    `{
      "live": *[_type == "visitor" && visitorHash in $hashes]{
        _id, visitorHash, isSpammer, visitTier, visitCount, reportCount, suggestionCount, contributionScore, country, city, lastActivityAt
      },
      "archived": *[_type == "visitorBundle"].visitors[visitorHash in $hashes]{
        visitorHash, isSpammer, visitTier, visitCount, reportCount, suggestionCount, contributionScore, country, city, lastActivityAt
      }
    }`,
    { hashes: unique }
  );

  const map = new Map<string, ResolvedVisitor>();
  for (const h of unique) {
    const row = pickLive((live ?? []).find(r => r.visitorHash === h), h) ?? pickArchived(archived, h);
    if (row) map.set(h, row);
  }
  return map;
}

export async function isVisitorSpammerByHash(visitorHash: string | undefined): Promise<boolean> {
  if (!visitorHash) return false;
  const v = await fetchVisitorByHash(visitorHash);
  return v?.isSpammer === true;
}
