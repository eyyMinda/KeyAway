/** @fileoverview Dotted version comparison shared by the version-check job and the admin UI. */

/** Numeric dotted compare ("18.10" > "18.9"); non-numeric parts are ignored. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(/[.\-_ ]/).map(x => parseInt(x, 10)).filter(n => !Number.isNaN(n));
  const pb = b.split(/[.\-_ ]/).map(x => parseInt(x, 10)).filter(n => !Number.isNaN(n));
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

/** True when `found` is newer than `current` (or there is no current version). */
export function isNewerVersion(found: string | null | undefined, current: string | null | undefined): boolean {
  if (!found) return false;
  if (!current?.trim()) return true;
  return compareVersions(found, current) > 0;
}
