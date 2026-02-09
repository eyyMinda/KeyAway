export const SLUG_REGEX = /^[a-z0-9-]+$/;

export function titleToSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");
}

export function validateSlug(raw: string): { normalized: string; error: string | null } {
  const normalized = titleToSlug(raw);
  if (!raw.trim()) return { normalized: "", error: "Slug is required" };
  if (!normalized) return { normalized: "", error: "Use at least one letter or number" };
  if (!SLUG_REGEX.test(normalized)) return { normalized: "", error: "Only lowercase letters, numbers, and hyphens" };
  return { normalized, error: null };
}
