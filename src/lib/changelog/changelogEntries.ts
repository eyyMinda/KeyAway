export type ChangelogTag = "feat" | "fix" | "ui" | "perf" | "api" | "docs" | "refactor" | "enhance";

export type ChangelogSection = {
  title: string;
  items: string[];
};

/** Release notes content — add new entries when major versions ship. */
export type ChangelogRelease = {
  id: string;
  releasedAt: string;
  title: string;
  prNumber: number;
  tags: ChangelogTag[];
  summary: string;
  highlights: string[];
  sections?: ChangelogSection[];
};

export function formatChangelogDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}
