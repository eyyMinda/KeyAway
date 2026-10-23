/**
 * @fileoverview Runs program version checks and stores results on `program.versionStatus`.
 * Writes only when a result changes (so the daily job does not touch every document), and applies a
 * newer version to `latestOfficialVersion` when the program opted into auto-apply. Server only.
 */
import { afterProgramWrite } from "@/src/lib/admin/programWrite";
import { mutationClient } from "@/src/lib/sanity/mutationClient";
import { isNewerVersion } from "./compareVersions";
import { lookupLatestVersion, type VersionCheckConfig } from "./versionSources";

export interface VersionCheckProgram {
  _id: string;
  title: string;
  slug?: string;
  latestOfficialVersion?: string | null;
  versionCheck?: VersionCheckConfig | null;
  versionStatus?: {
    latestVersion?: string | null;
    releasedAt?: string | null;
    error?: string | null;
    changedAt?: string | null;
  } | null;
}

export interface VersionCheckOutcome {
  programId: string;
  title: string;
  current: string | null;
  found: string | null;
  error: string | null;
  /** Found version is newer than `latestOfficialVersion` (after any auto-apply, the old value). */
  newer: boolean;
  applied: boolean;
  url?: string;
}

export const versionCheckProgramProjection = `{
  _id, title, "slug": slug.current, latestOfficialVersion, versionCheck, versionStatus
}`;

/** Checks one program with its saved settings and stores the result. */
export async function checkProgramVersion(program: VersionCheckProgram): Promise<VersionCheckOutcome> {
  const config = program.versionCheck;
  const lookup = await lookupLatestVersion(config);
  const current = program.latestOfficialVersion?.trim() || null;
  const found = lookup.ok ? lookup.version : null;
  const newer = isNewerVersion(found, current);
  let applied = false;

  const prev = program.versionStatus ?? {};
  const next = {
    latestVersion: found ?? prev.latestVersion ?? undefined,
    releasedAt: lookup.ok ? (lookup.releasedAt ?? undefined) : (prev.releasedAt ?? undefined),
    error: lookup.ok ? undefined : lookup.error
  };
  const changed =
    (prev.latestVersion ?? undefined) !== next.latestVersion ||
    (prev.releasedAt ?? undefined) !== next.releasedAt ||
    (prev.error ?? undefined) !== next.error;
  const autoApply = newer && !!found && config?.autoApply === true;

  if (changed || autoApply) {
    const patch = mutationClient.patch(program._id);
    if (changed) patch.set({ versionStatus: { ...next, changedAt: new Date().toISOString() } });
    if (autoApply) patch.set({ latestOfficialVersion: found });
    await patch.commit();
    if (autoApply) {
      applied = true;
      await afterProgramWrite({ slug: program.slug });
    }
  }

  return {
    programId: program._id,
    title: program.title,
    current,
    found,
    error: lookup.ok ? null : lookup.error,
    newer,
    applied,
    url: lookup.ok ? lookup.url : undefined
  };
}

/** Checks every program that has a version source, a few at a time. */
export async function runAllVersionChecks(): Promise<VersionCheckOutcome[]> {
  const programs = await mutationClient.fetch<VersionCheckProgram[]>(
    `*[_type == "program" && defined(versionCheck.source) && !(_id in path("drafts.**"))]${versionCheckProgramProjection}`
  );
  const outcomes: VersionCheckOutcome[] = [];
  const queue = [...programs];
  const worker = async () => {
    for (let p = queue.shift(); p; p = queue.shift()) outcomes.push(await checkProgramVersion(p));
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  return outcomes;
}

export function summarizeOutcomes(outcomes: VersionCheckOutcome[]): string {
  const newer = outcomes.filter(o => o.newer);
  const errors = outcomes.filter(o => o.error);
  const parts = [`${outcomes.length} checked`, `${newer.length} new`, `${errors.length} failed`];
  if (newer.length) parts.push(newer.map(o => `${o.title} ${o.current ?? "?"}→${o.found}${o.applied ? " (applied)" : ""}`).join("; "));
  return parts.join(", ");
}
