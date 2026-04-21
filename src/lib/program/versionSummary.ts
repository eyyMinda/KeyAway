import semver from "semver";
import type { CDKey, Program } from "@/src/types";
import { portableTextToPlainText } from "@/src/lib/portableText/toPlainText";

/** Working keys only: semver-coerced max of `version` (invalid strings skipped). */
export function getHighestKeyVersion(cdKeys: CDKey[]): string | null {
  const candidates = cdKeys
    .filter(k => k.status === "new" || k.status === "active")
    .map(k => k.version?.trim())
    .filter((v): v is string => Boolean(v));

  let best: { raw: string; sem: semver.SemVer } | null = null;
  for (const raw of candidates) {
    const coerced = semver.coerce(raw);
    if (!coerced) continue;
    if (!best || semver.gt(coerced, best.sem)) {
      best = { raw, sem: coerced };
    }
  }
  return best?.raw ?? null;
}

function versionsLooselyEqual(a: string, b: string): boolean {
  const ca = semver.coerce(a);
  const cb = semver.coerce(b);
  if (ca && cb) return semver.eq(ca, cb);
  return a.trim() === b.trim();
}

/**
 * Vendor release string to weave into the CD key table intro (avoids repeating it in `formatVersionSummaryLine`).
 * Omit when vendor vs. listed keys disagree — the supplemental line carries that case.
 */
export function getCdKeyTableIntroVendorRelease(program: Program, highestKeyVersion: string | null): string | null {
  const official = program.latestOfficialVersion?.trim();
  if (!official) return null;
  const hk = highestKeyVersion?.trim();
  if (hk && !versionsLooselyEqual(official, hk)) return null;
  return official;
}

/** Short muted sentence after the intro when keys align with the vendor release (both present and equal). */
export function getCdKeyTableIntroVersionConfirmation(
  program: Program,
  highestKeyVersion: string | null
): string | null {
  const official = program.latestOfficialVersion?.trim();
  const hk = highestKeyVersion?.trim();
  if (!official || !hk) return null;
  if (!versionsLooselyEqual(official, hk)) return null;
  return "Listed keys are for the latest build.";
}

/** Supplemental clause (muted) for mismatch or keys-only; null when the intro already covers it. */
export function formatVersionSummaryLine(program: Program, highestKeyVersion: string | null): string | null {
  const official = program.latestOfficialVersion?.trim();
  const hk = highestKeyVersion?.trim();

  if (!official && !hk) return null;

  if (official && hk) {
    if (versionsLooselyEqual(official, hk)) return null;
    return `Listed keys are tagged through ${hk}; the vendor ships ${official} now — try newer rows first if activation fails.`;
  }
  if (official) return null;
  return `Newest version tag in this list is ${hk}.`;
}

/** Display name for titles / OG: prefer vendor version, else highest key version. */
export function formatProgramSeoName(program: Program, highestKeyVersion: string | null): string {
  const official = program.latestOfficialVersion?.trim();
  if (official) return `${program.title} ${official}`.trim();
  if (highestKeyVersion?.trim()) return `${program.title} ${highestKeyVersion.trim()}`.trim();
  return program.title;
}

/** For JSON-LD `softwareVersion`: vendor first, else max key version. */
export function getSoftwareVersionForSchema(program: Program, cdKeys: CDKey[]): string | undefined {
  const official = program.latestOfficialVersion?.trim();
  if (official) return official;
  return getHighestKeyVersion(cdKeys) ?? undefined;
}

export function buildSoftwareApplicationDescription(program: Program): string {
  const seo = program.seo?.metaDescription?.trim();
  if (seo) return seo;
  const aboutBlob = program.aboutSections
    ?.map(s => {
      const desc = portableTextToPlainText(s.description);
      const points = s.points
        ?.map(p => portableTextToPlainText(p.text))
        .filter(Boolean)
        .join("\n");
      return [desc, points].filter(Boolean).join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
  const base = portableTextToPlainText(program.description);
  if (aboutBlob && base) {
    const combined = `${base}\n\n${aboutBlob}`;
    return combined.length > 320 ? `${combined.slice(0, 317)}…` : combined;
  }
  if (aboutBlob) return aboutBlob.length > 320 ? `${aboutBlob.slice(0, 317)}…` : aboutBlob;
  return base;
}
