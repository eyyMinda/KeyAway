import type { ChangelogRelease, ChangelogSection } from "@/src/lib/changelog/changelogEntries";
import {
  isSensitiveChangelogLine,
  sanitizeChangelogBullet,
  sanitizeChangelogText,
  shouldSkipChangelogSection
} from "@/src/lib/changelog/changelogContentFilter";
import { resolveChangelogTags } from "@/src/lib/changelog/changelogTags";

type ParsedSection = {
  title: string;
  content: string;
};

const LEGACY_HIGHLIGHT_SECTION_TITLES = ["active changes", "changes", "highlights", "what's new", "whats new"];
const CHANGELOG_BLOCK_TITLE = "changelog";

function sectionKey(title: string): string {
  return title.trim().toLowerCase();
}

function splitPublicBody(body: string): string {
  const parts = body.split(/^---\s*$/m);
  return parts[0]?.trim() ?? body;
}

function parseMarkdownSections(body: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const chunks = body.split(/^##\s+/m);

  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i] ?? "";
    const newline = chunk.indexOf("\n");
    if (newline === -1) {
      sections.push({ title: chunk.trim(), content: "" });
      continue;
    }
    sections.push({
      title: chunk.slice(0, newline).trim(),
      content: chunk.slice(newline + 1).trim()
    });
  }

  return sections;
}

function extractBullets(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => /^[-*]\s+/.test(line))
    .map(line => sanitizeChangelogBullet(line))
    .filter(line => line.length > 0 && !isSensitiveChangelogLine(line));
}

function firstParagraph(content: string): string {
  const blocks = content
    .split(/\r?\n\r?\n/)
    .map(block => block.trim())
    .filter(Boolean);

  for (const block of blocks) {
    if (/^[-*]\s+/m.test(block)) continue;
    const sanitized = sanitizeChangelogText(block.replace(/\r?\n/g, " "));
    if (sanitized) return sanitized;
  }

  return "";
}

function parseChangelogSubsections(changelogContent: string): {
  highlights: string[];
  sections: ChangelogSection[];
} {
  const withoutTagComment = changelogContent.replace(/<!--\s*tags:[^>]+-->/i, "").trim();
  const subParts = withoutTagComment.split(/^###\s+/m);

  if (subParts.length <= 1) {
    const bullets = extractBullets(withoutTagComment);
    return { highlights: bullets, sections: [] };
  }

  const sections: ChangelogSection[] = [];
  let highlights: string[] = [];

  for (let i = 1; i < subParts.length; i++) {
    const chunk = subParts[i] ?? "";
    const newline = chunk.indexOf("\n");
    const title = (newline === -1 ? chunk : chunk.slice(0, newline)).trim();
    const content = newline === -1 ? "" : chunk.slice(newline + 1).trim();
    const items = extractBullets(content);
    if (items.length === 0) continue;

    if (sectionKey(title) === "highlights") {
      highlights = items;
      continue;
    }

    sections.push({ title, items });
  }

  if (highlights.length === 0) {
    highlights = sections.flatMap(section => section.items).slice(0, 6);
  }

  return { highlights, sections };
}

function parseLegacySections(visible: ParsedSection[]): {
  summary: string;
  highlights: string[];
  sections: ChangelogSection[];
} {
  const summarySection = visible.find(section => sectionKey(section.title) === "summary");
  const summary =
    (summarySection ? firstParagraph(summarySection.content) : "") ||
    firstParagraph(visible.map(section => section.content).join("\n\n"));

  const highlightSection = visible.find(section =>
    LEGACY_HIGHLIGHT_SECTION_TITLES.includes(sectionKey(section.title))
  );
  const highlights = highlightSection
    ? extractBullets(highlightSection.content)
    : extractBullets(visible.map(section => section.content).join("\n")).slice(0, 6);

  const sections: ChangelogSection[] = visible
    .filter(section => {
      const key = sectionKey(section.title);
      if (key === "summary" || key === CHANGELOG_BLOCK_TITLE) return false;
      if (LEGACY_HIGHLIGHT_SECTION_TITLES.includes(key)) return false;
      return extractBullets(section.content).length > 0;
    })
    .map(section => ({
      title: section.title,
      items: extractBullets(section.content)
    }));

  return { summary, highlights, sections };
}

export type GitHubPullRequest = {
  number: number;
  title: string;
  body: string | null;
  merged_at: string | null;
  labels?: string[];
};

export function pullRequestToChangelogRelease(pr: GitHubPullRequest): ChangelogRelease | null {
  if (!pr.merged_at) return null;

  const publicBody = splitPublicBody(pr.body?.trim() ?? "");
  const parsed = parseMarkdownSections(publicBody);
  const visible = parsed.filter(section => !shouldSkipChangelogSection(section.title));

  const changelogSection = visible.find(section => sectionKey(section.title) === CHANGELOG_BLOCK_TITLE);
  const legacy = parseLegacySections(visible);

  let summary = legacy.summary;
  let highlights = legacy.highlights;
  let sections = legacy.sections;

  if (changelogSection) {
    const structured = parseChangelogSubsections(changelogSection.content);
    highlights = structured.highlights.length > 0 ? structured.highlights : highlights;
    sections = structured.sections.length > 0 ? structured.sections : sections;
  }

  if (!summary) {
    summary = firstParagraph(publicBody) || sanitizeChangelogText(pr.title);
  }

  if (highlights.length === 0) {
    highlights = sections.flatMap(section => section.items).slice(0, 6);
  }
  if (highlights.length === 0) {
    highlights = [summary];
  }

  const mergedDate = new Date(pr.merged_at);
  const id = Number.isFinite(mergedDate.getTime())
    ? `${mergedDate.toISOString().slice(0, 10)}-pr-${pr.number}`
    : `pr-${pr.number}`;

  return {
    id,
    releasedAt: pr.merged_at,
    title: sanitizeChangelogText(pr.title) || pr.title,
    prNumber: pr.number,
    tags: resolveChangelogTags(publicBody, pr.title, pr.labels ?? []),
    summary,
    highlights,
    sections: sections.length > 0 ? sections : undefined
  };
}
