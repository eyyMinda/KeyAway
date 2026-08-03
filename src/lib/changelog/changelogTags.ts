import type { ChangelogTag } from "@/src/lib/changelog/changelogEntries";

export const CHANGELOG_TAGS: readonly ChangelogTag[] = [
  "feat",
  "fix",
  "ui",
  "perf",
  "api",
  "docs",
  "refactor",
  "enhance"
] as const;

const CHANGELOG_TAG_SET = new Set<string>(CHANGELOG_TAGS);

/** Accept common synonyms in PR comments (normalized to canonical tag). */
const CHANGELOG_TAG_ALIASES: Record<string, ChangelogTag> = {
  doc: "docs",
  documentation: "docs",
  refactoring: "refactor",
  enhancement: "enhance",
  improvements: "enhance",
  improve: "enhance"
};

/** HTML comment in PR body: `<!-- tags: feat, ui, api -->` */
export const CHANGELOG_TAGS_COMMENT_RE = /<!--\s*tags:\s*([^>]+?)\s*-->/i;

function normalizeTagToken(raw: string): ChangelogTag | null {
  const token = raw.trim().toLowerCase();
  if (isChangelogTag(token)) return token;
  const alias = CHANGELOG_TAG_ALIASES[token];
  return alias ?? null;
}

export function isChangelogTag(value: string): value is ChangelogTag {
  return CHANGELOG_TAG_SET.has(value.trim().toLowerCase());
}

export function parseChangelogTagsFromComment(body: string): ChangelogTag[] {
  const match = CHANGELOG_TAGS_COMMENT_RE.exec(body);
  if (!match?.[1]) return [];

  return [
    ...new Set(
      match[1]
        .split(/[,|\s]+/)
        .map(token => normalizeTagToken(token))
        .filter((tag): tag is ChangelogTag => tag !== null)
    )
  ];
}

export function parseChangelogTagsFromLabels(labels: string[]): ChangelogTag[] {
  return [
    ...new Set(
      labels.map(label => normalizeTagToken(label)).filter((tag): tag is ChangelogTag => tag !== null)
    )
  ];
}

export function inferChangelogTagsFromTitle(title: string): ChangelogTag[] {
  const tags = new Set<ChangelogTag>();
  const lower = title.toLowerCase();

  if (lower.startsWith("feat")) tags.add("feat");
  if (lower.startsWith("fix")) tags.add("fix");
  if (lower.startsWith("docs")) tags.add("docs");
  if (lower.startsWith("refactor")) tags.add("refactor");
  if (/\bui\b|style|design/.test(lower)) tags.add("ui");
  if (/\bperf\b|performance/.test(lower)) tags.add("perf");
  if (/\bapi\b|route|endpoint/.test(lower)) tags.add("api");
  if (/\benhance|\bimprove/.test(lower)) tags.add("enhance");

  return [...tags];
}

export function resolveChangelogTags(body: string, title: string, labels: string[] = []): ChangelogTag[] {
  const merged = new Set<ChangelogTag>([
    ...parseChangelogTagsFromComment(body),
    ...parseChangelogTagsFromLabels(labels),
    ...inferChangelogTagsFromTitle(title)
  ]);

  if (merged.size === 0) merged.add("feat");
  return [...merged];
}
