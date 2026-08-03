/**
 * Shared changelog parser + Sanity upsert helpers for Node scripts / GitHub Actions.
 * Mirrors src/lib/changelog/* (keep in sync when parser changes).
 */
import { createClient } from "@sanity/client";

export const CHANGELOG_TAGS = [
  "feat",
  "fix",
  "ui",
  "perf",
  "api",
  "docs",
  "refactor",
  "enhance"
];

const CHANGELOG_TAG_SET = new Set(CHANGELOG_TAGS);

const CHANGELOG_TAG_ALIASES = {
  doc: "docs",
  documentation: "docs",
  refactoring: "refactor",
  enhancement: "enhance",
  improvements: "enhance",
  improve: "enhance"
};

export const SKIP_LABEL = "skip-changelog";
export const GITHUB_OWNER = "eyyMinda";
export const GITHUB_REPO = "KeyAway";

const SKIP_SECTION_TITLES = new Set([
  "environment variables",
  "env variables",
  "environment",
  "testing",
  "technical details",
  "test plan"
]);

const SENSITIVE_LINE_PATTERNS = [
  /^\s*[A-Z][A-Z0-9_]{2,}\s*=\s*\S+/,
  /process\.env\./i,
  /\.env(\.[a-z]+)?\b/i,
  /\b(api[_-]?key|client[_-]?secret|secret[_-]?key|access[_-]?token|auth[_-]?token|private[_-]?key)\b/i,
  /\b(password|passwd|credential)s?\b/i,
  /\bgh\s+secret\b/i,
  /\bgithub[_-]?token\b/i,
  /\bsanity[_-]?api[_-]?token\b/i,
  /\bnextauth[_-]?secret\b/i,
  /\bresend[_-]?api[_-]?key\b/i
];

const INLINE_SECRET_VALUE_RE = /\b([A-Z][A-Z0-9_]{2,})=([^\s`]+)/g;
const CHANGELOG_TAGS_COMMENT_RE = /<!--\s*tags:\s*([^>]+?)\s*-->/i;
const LEGACY_HIGHLIGHT_SECTION_TITLES = ["active changes", "changes", "highlights", "what's new", "whats new"];
const CHANGELOG_BLOCK_TITLE = "changelog";

function sectionKey(title) {
  return title.trim().toLowerCase();
}

function shouldSkipChangelogSection(title) {
  return SKIP_SECTION_TITLES.has(title.trim().toLowerCase());
}

function isSensitiveChangelogLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return SENSITIVE_LINE_PATTERNS.some(pattern => pattern.test(trimmed));
}

function sanitizeChangelogText(text) {
  const withoutCodeBlocks = text.replace(/```[\s\S]*?```/g, "");
  const lines = withoutCodeBlocks.split(/\r?\n/);

  return lines
    .map(line => {
      if (isSensitiveChangelogLine(line)) return "";
      return line.replace(INLINE_SECRET_VALUE_RE, "$1=[redacted]");
    })
    .filter(line => line.trim().length > 0)
    .join("\n")
    .trim();
}

function sanitizeChangelogBullet(text) {
  const cleaned = sanitizeChangelogText(text.replace(/^[-*]\s+/, "").trim());
  return cleaned.replace(/`([^`]+)`/g, "$1");
}

function isChangelogTag(value) {
  return CHANGELOG_TAG_SET.has(value.trim().toLowerCase());
}

function normalizeTagToken(raw) {
  const token = raw.trim().toLowerCase();
  if (isChangelogTag(token)) return token;
  return CHANGELOG_TAG_ALIASES[token] ?? null;
}

function parseChangelogTagsFromComment(body) {
  const match = CHANGELOG_TAGS_COMMENT_RE.exec(body);
  if (!match?.[1]) return [];

  return [
    ...new Set(
      match[1]
        .split(/[,|\s]+/)
        .map(token => normalizeTagToken(token))
        .filter(Boolean)
    )
  ];
}

function parseChangelogTagsFromLabels(labels) {
  return [
    ...new Set(labels.map(label => normalizeTagToken(label)).filter(Boolean))
  ];
}

function inferChangelogTagsFromTitle(title) {
  const tags = new Set();
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

function resolveChangelogTags(body, title, labels = []) {
  const merged = new Set([
    ...parseChangelogTagsFromComment(body),
    ...parseChangelogTagsFromLabels(labels),
    ...inferChangelogTagsFromTitle(title)
  ]);

  if (merged.size === 0) merged.add("feat");
  return [...merged];
}

function splitPublicBody(body) {
  const parts = body.split(/^---\s*$/m);
  return parts[0]?.trim() ?? body;
}

function parseMarkdownSections(body) {
  const sections = [];
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

function extractBullets(content) {
  return content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => /^[-*]\s+/.test(line))
    .map(line => sanitizeChangelogBullet(line))
    .filter(line => line.length > 0 && !isSensitiveChangelogLine(line));
}

function firstParagraph(content) {
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

function parseChangelogSubsections(changelogContent) {
  const withoutTagComment = changelogContent.replace(/<!--\s*tags:[^>]+-->/i, "").trim();
  const subParts = withoutTagComment.split(/^###\s+/m);

  if (subParts.length <= 1) {
    const bullets = extractBullets(withoutTagComment);
    return { highlights: bullets, sections: [] };
  }

  const sections = [];
  let highlights = [];

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

function parseLegacySections(visible) {
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

  const sections = visible
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

export function pullRequestToChangelogRelease(pr) {
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

export function hasSkipChangelogLabel(labels = []) {
  return labels.some(label => String(label).toLowerCase() === SKIP_LABEL);
}

export function changelogDocId(prNumber) {
  return `changelogRelease.pr.${prNumber}`;
}

export function releaseToSanityDoc(release, { published = false, rawPrBody } = {}) {
  return {
    _id: changelogDocId(release.prNumber),
    _type: "changelogRelease",
    prNumber: release.prNumber,
    releasedAt: release.releasedAt,
    title: release.title,
    summary: release.summary,
    tags: release.tags,
    highlights: release.highlights,
    sections: (release.sections ?? []).map(section => ({
      _type: "changelogSection",
      title: section.title,
      items: section.items
    })),
    published,
    ...(rawPrBody ? { rawPrBody } : {})
  };
}

export function createSanityClientFromEnv() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_STUDIO_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_STUDIO_DATASET;
  const apiVersion = process.env.NEXT_PUBLIC_SANITY_STUDIO_API_VERSION || "2025-09-07";
  const token = process.env.SANITY_API_TOKEN;

  if (!projectId || !dataset) {
    throw new Error("Missing NEXT_PUBLIC_SANITY_STUDIO_PROJECT_ID / NEXT_PUBLIC_SANITY_STUDIO_DATASET.");
  }
  if (!token) {
    throw new Error("SANITY_API_TOKEN is required.");
  }

  return createClient({ projectId, dataset, apiVersion, token, useCdn: false });
}

export async function fetchGitHubPullRequest(number, token) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls/${number}`;
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "KeyAway-Changelog-Sync"
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { headers });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${response.statusText}`);
  }

  const pull = await response.json();
  return {
    number: pull.number,
    title: pull.title,
    body: pull.body,
    merged_at: pull.merged_at,
    labels: (pull.labels ?? []).map(label => label.name)
  };
}

/** Paginated merged PR list (newest merge first). */
export async function fetchMergedPullRequests({ maxPages = 3, token } = {}) {
  const pulls = [];

  for (let page = 1; page <= maxPages; page++) {
    const url = new URL(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls`);
    url.searchParams.set("state", "closed");
    url.searchParams.set("sort", "updated");
    url.searchParams.set("direction", "desc");
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));

    const headers = {
      Accept: "application/vnd.github+json",
      "User-Agent": "KeyAway-Changelog-Backfill"
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`GitHub API ${response.status}: ${response.statusText}`);
    }

    const batch = await response.json();
    if (!Array.isArray(batch) || batch.length === 0) break;

    pulls.push(
      ...batch.map(pull => ({
        number: pull.number,
        title: pull.title,
        body: pull.body,
        merged_at: pull.merged_at,
        labels: (pull.labels ?? []).map(label => label.name)
      }))
    );

    if (batch.length < 100) break;
  }

  return pulls
    .filter(pull => pull.merged_at)
    .filter(pull => !hasSkipChangelogLabel(pull.labels))
    .sort((a, b) => new Date(b.merged_at).getTime() - new Date(a.merged_at).getTime());
}

export async function upsertChangelogRelease(client, release, options = {}) {
  const { published = false, rawPrBody, preservePublished = false } = options;
  const id = changelogDocId(release.prNumber);

  let effectivePublished = published;
  if (preservePublished) {
    const existing = await client.getDocument(id).catch(() => null);
    if (existing?.published === true) effectivePublished = true;
  }

  const doc = releaseToSanityDoc(release, { published: effectivePublished, rawPrBody });
  await client.createOrReplace(doc, { autoGenerateArrayKeys: true });
  return id;
}
