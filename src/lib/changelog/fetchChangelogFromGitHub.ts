import type { ChangelogRelease } from "@/src/lib/changelog/changelogEntries";
import { pullRequestToChangelogRelease } from "@/src/lib/changelog/parsePullRequestBody";

const GITHUB_OWNER = "eyyMinda";
const GITHUB_REPO = "KeyAway";
const DEFAULT_LIMIT = 50;
const SKIP_LABEL = "skip-changelog";

type GitHubPullApiItem = {
  number: number;
  title: string;
  body: string | null;
  merged_at: string | null;
  labels: Array<{ name: string }>;
};

async function fetchMergedPullRequests(limit: number): Promise<GitHubPullApiItem[]> {
  const merged: GitHubPullApiItem[] = [];
  const maxPages = Math.max(1, Math.ceil(limit / 100));

  for (let page = 1; page <= maxPages && merged.length < limit; page++) {
    const url = new URL(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls`);
    url.searchParams.set("state", "closed");
    url.searchParams.set("sort", "updated");
    url.searchParams.set("direction", "desc");
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "KeyAway-Changelog"
      },
      next: { revalidate: 43200 }
    });

    if (!response.ok) {
      console.error("[changelog] GitHub API error:", response.status, response.statusText);
      break;
    }

    const pulls = (await response.json()) as GitHubPullApiItem[];
    if (!pulls.length) break;

    for (const pull of pulls) {
      if (!pull.merged_at) continue;
      if (pull.labels.some(label => label.name.toLowerCase() === SKIP_LABEL)) continue;
      merged.push(pull);
    }

    if (pulls.length < 100) break;
  }

  return merged
    .sort((a, b) => new Date(b.merged_at!).getTime() - new Date(a.merged_at!).getTime())
    .slice(0, limit);
}

export async function fetchChangelogReleasesFromGitHub(limit = DEFAULT_LIMIT): Promise<ChangelogRelease[]> {
  const pulls = await fetchMergedPullRequests(limit);

  return pulls
    .map(pull =>
      pullRequestToChangelogRelease({
        number: pull.number,
        title: pull.title,
        body: pull.body,
        merged_at: pull.merged_at,
        labels: pull.labels.map(label => label.name)
      })
    )
    .filter((release): release is ChangelogRelease => release !== null);
}
