/**
 * One-time backfill: upsert `changelogRelease` docs from merged GitHub PRs.
 *
 *   npm run backfill:changelog            # dry run
 *   npm run backfill:changelog -- --write # upsert with published: true
 *   npm run backfill:changelog -- --write --draft  # upsert as drafts
 *
 * Requires: NEXT_PUBLIC_SANITY_STUDIO_*, SANITY_API_TOKEN
 * Optional: GITHUB_TOKEN (higher rate limits)
 */
import {
  createSanityClientFromEnv,
  fetchMergedPullRequests,
  pullRequestToChangelogRelease,
  upsertChangelogRelease
} from "./changelogSyncUtils.mjs";

const WRITE = process.argv.includes("--write");
const DRAFT = process.argv.includes("--draft");

async function main() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const pulls = await fetchMergedPullRequests({ maxPages: 3, token });

  const releases = pulls
    .map(pull => pullRequestToChangelogRelease(pull))
    .filter(release => release !== null);

  console.log(`Merged PRs (excl. skip-changelog): ${releases.length}`);
  for (const release of releases.slice(0, 10)) {
    console.log(`  - #${release.prNumber} ${release.title.slice(0, 60)}… [${release.tags.join(", ")}]`);
  }
  if (releases.length > 10) console.log(`  … and ${releases.length - 10} more`);

  if (!WRITE) {
    console.log("\nDry run. Re-run with -- --write to upsert (published: true by default).");
    return;
  }

  const client = createSanityClientFromEnv();
  const published = !DRAFT;
  let count = 0;

  for (const release of releases) {
    const pull = pulls.find(p => p.number === release.prNumber);
    await upsertChangelogRelease(client, release, {
      published,
      rawPrBody: pull?.body ?? undefined
    });
    count++;
  }

  console.log(`\nUpserted ${count} changelogRelease docs (published: ${published}).`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
