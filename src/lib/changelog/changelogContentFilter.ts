/** Sections omitted from public changelog (internal / sensitive). */
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

export function shouldSkipChangelogSection(title: string): boolean {
  return SKIP_SECTION_TITLES.has(title.trim().toLowerCase());
}

export function isSensitiveChangelogLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return SENSITIVE_LINE_PATTERNS.some(pattern => pattern.test(trimmed));
}

/** Strip or redact env-like assignments and drop sensitive lines. */
export function sanitizeChangelogText(text: string): string {
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

export function sanitizeChangelogBullet(text: string): string {
  const cleaned = sanitizeChangelogText(text.replace(/^[-*]\s+/, "").trim());
  return cleaned.replace(/`([^`]+)`/g, "$1");
}
