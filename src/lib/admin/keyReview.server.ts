/** @fileoverview Loads reports, keys and visitors for the key report review (see keyReview.ts). Cached briefly. */
import { unstable_cache } from "next/cache";
import { client } from "@/src/sanity/lib/client";
import { db } from "@/src/lib/db/postgres";
import { getKeyData } from "@/src/lib/keyHashing";
import { getActivationEntryDisplayLabel, normalizeProgramFlow } from "@/src/lib/program/activationEntry";
import { fetchVisitorsByHashes } from "@/src/lib/visitors/visitorStore";
import {
  REVIEW_WINDOW_DAYS,
  reviewKeyReports,
  type KeyReview,
  type ReviewKey,
  type ReviewReport,
  type ReviewVisitor
} from "@/src/lib/admin/keyReview";
import type { CDKey, CDKeyStatus } from "@/src/types/program";

export const TAG_KEY_REVIEW = "admin-key-review";
const CACHE_SECONDS = 120;

type ProgramRow = {
  slug?: string;
  title?: string;
  programFlow?: string;
  latestOfficialVersion?: string;
  cdKeys?: CDKey[] | null;
};

async function loadKeyReview(): Promise<KeyReview> {
  const [reports, programs] = await Promise.all([
    db()<
      Array<
        ReviewReport & { fit: string | null; triedVersion: string | null; ipHash: string | null; label: string | null }
      >
    >`
      select id, program_slug, key, label, event_type, created_at, tried_version_fit as fit, tried_version, ip_hash
      from analytics.key_reports
      where created_at >= now() - make_interval(days => ${REVIEW_WINDOW_DAYS}) and key is not null
    `,
    client.fetch<ProgramRow[]>(
      `*[_type == "program" && !(_id in path("drafts.**"))]{
        "slug": slug.current, title, programFlow, latestOfficialVersion, cdKeys
      }`,
      {},
      { useCdn: false }
    )
  ]);

  const keys: ReviewKey[] = [];
  for (const program of programs) {
    if (!program.slug) continue;
    const flow = normalizeProgramFlow(program.programFlow);
    for (const row of program.cdKeys ?? []) {
      const storageKey = getKeyData({ ...row, programFlow: flow }, flow)?.hash;
      if (!storageKey) continue;
      keys.push({
        programSlug: program.slug,
        programTitle: program.title ?? program.slug,
        storageKey,
        keyId: row._key,
        label: getActivationEntryDisplayLabel(row, flow),
        status: (row.status ?? "active") as CDKeyStatus,
        version: row.version?.trim() || undefined,
        validUntil: row.validUntil || undefined,
        latestVersion: program.latestOfficialVersion?.trim() || undefined
      });
    }
  }

  const visitorRows = await fetchVisitorsByHashes(reports.map(r => r.ipHash ?? "").filter(Boolean));
  const visitors = new Map<string, ReviewVisitor>(
    [...visitorRows].map(([hash, v]) => [hash, { tier: v.visitTier, spammer: v.isSpammer }])
  );

  return reviewKeyReports(
    reports.map(r => ({
      ...r,
      label: r.label ?? undefined,
      fit: r.fit ?? undefined,
      triedVersion: r.triedVersion ?? undefined,
      ipHash: r.ipHash ?? undefined
    })),
    keys,
    visitors
  );
}

export const getCachedKeyReview = unstable_cache(loadKeyReview, ["admin-key-review"], {
  revalidate: CACHE_SECONDS,
  tags: [TAG_KEY_REVIEW]
});
