/** Short program version labels for version-fit key reports (e.g. `16`, `16.0`, `9.1`). */

export const TRIED_VERSION_INPUT_PATTERN = /^\d{1,2}(\.\d)?$/;

export function isValidTriedVersionInput(input: string): boolean {
  const t = input.trim();
  return t.length > 0 && TRIED_VERSION_INPUT_PATTERN.test(t);
}

export type ParsedShortVersion = { major: number; minor: number | null };

export function parseShortVersion(input: string): ParsedShortVersion | null {
  const t = input.trim();
  if (!isValidTriedVersionInput(t)) return null;
  const [maj, min] = t.split(".");
  const major = Number.parseInt(maj, 10);
  if (min === undefined) return { major, minor: null };
  return { major, minor: Number.parseInt(min, 10) };
}

/** Dedup key: `16` and `16.0` share the same key. Invalid legacy values stay unique by raw text. */
export function versionLabelCanonicalKey(input: string): string | null {
  const t = input.trim();
  if (!t) return null;
  const parsed = parseShortVersion(t);
  if (!parsed) return `__raw:${t.toLowerCase()}`;
  const minor = parsed.minor ?? 0;
  return `${parsed.major}.${minor}`;
}

/** Display: whole minor → `16`; non-zero minor → `16.5`. Invalid legacy text shown as stored. */
export function formatVersionLabelDisplay(input: string): string {
  const parsed = parseShortVersion(input);
  if (!parsed) return input.trim();
  const minor = parsed.minor ?? 0;
  if (minor === 0) return String(parsed.major);
  return `${parsed.major}.${minor}`;
}

export function normalizeTriedVersionForStorage(input: string): string | null {
  if (!isValidTriedVersionInput(input)) return null;
  return formatVersionLabelDisplay(input);
}

/** Compare in 0.1 steps (15.6 → 156 tenths). */
export function shortVersionToTenths(parsed: ParsedShortVersion): number {
  return parsed.major * 10 + (parsed.minor ?? 0);
}

/** Parse listed key version when it matches the short label shape (may include extra text). */
export function parseListedVersionForCompare(listed: string): ParsedShortVersion | null {
  const t = listed.trim();
  if (!t) return null;
  const direct = parseShortVersion(t);
  if (direct) return direct;
  const m = t.match(/(\d{1,2})(?:\.(\d))?/);
  if (!m) return null;
  const major = Number.parseInt(m[1], 10);
  const minor = m[2] !== undefined ? Number.parseInt(m[2], 10) : null;
  if (minor !== null && (minor < 0 || minor > 9)) return null;
  return { major, minor };
}

/** “Other version” must be strictly newer than listed — at least +0.1 (15.6 → min 15.7). */
export function isOtherTriedVersionNewerThanListed(tried: string, listed: string): boolean {
  if (!isValidTriedVersionInput(tried)) return false;
  const triedParsed = parseShortVersion(tried);
  const listedParsed = parseListedVersionForCompare(listed);
  if (!triedParsed || !listedParsed) return true;
  return shortVersionToTenths(triedParsed) >= shortVersionToTenths(listedParsed) + 1;
}

export function isValidOtherTriedVersionInput(tried: string, listed: string): boolean {
  return isValidTriedVersionInput(tried) && isOtherTriedVersionNewerThanListed(tried, listed);
}

export function minOtherTriedVersionExample(listed: string): string | null {
  const listedParsed = parseListedVersionForCompare(listed);
  if (!listedParsed) return null;
  const tenths = shortVersionToTenths(listedParsed) + 1;
  const major = Math.floor(tenths / 10);
  const minor = tenths % 10;
  return minor === 0 ? String(major) : `${major}.${minor}`;
}

export function mergeUniqueVersionLabels(labels: string[]): string[] {
  const byKey = new Map<string, string>();
  for (const label of labels) {
    const key = versionLabelCanonicalKey(label);
    if (!key) continue;
    const display = formatVersionLabelDisplay(label);
    if (!byKey.has(key)) byKey.set(key, display);
  }
  return [...byKey.values()].sort(compareVersionLabelDisplay);
}

function compareVersionLabelDisplay(a: string, b: string): number {
  const pa = parseShortVersion(a);
  const pb = parseShortVersion(b);
  if (pa && pb) {
    if (pa.major !== pb.major) return pa.major - pb.major;
    return (pa.minor ?? 0) - (pb.minor ?? 0);
  }
  return a.localeCompare(b);
}

/** Restrict keystrokes while typing (1–2 digit major, optional `.` + 1 digit minor). */
export function filterTriedVersionInput(raw: string): string {
  let s = raw.replace(/[^\d.]/g, "");
  const dot = s.indexOf(".");
  if (dot !== -1) {
    s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "");
  }
  const parts = s.split(".");
  const major = parts[0]?.slice(0, 2) ?? "";
  const minor = parts[1]?.slice(0, 1) ?? "";
  if (parts.length > 1) {
    if (minor === "" && s.endsWith(".")) return `${major}.`;
    return `${major}.${minor}`;
  }
  return major;
}
