/**
 * Sync a single merged PR to Sanity as a changelogRelease draft.
 *
 *   npm run sync:changelog-pr -- 112
 *   node scripts/syncChangelogPrToSanity.mjs 112
 *
 * Skips PRs with the `skip-changelog` label. Used by GitHub Actions on merge.
 */
import {
  createSanityClientFromEnv,
  fetchGitHubPullRequest,
  hasSkipChangelogLabel,
  pullRequestToChangelogRelease,
  upsertChangelogRelease
} from "./changelogSyncUtils.mjs";

const prArg = process.argv.find(arg => /^\d+$/.test(arg));
const prNumber = prArg ? Number(prArg) : Number(process.env.PR_NUMBER);

if (!Number.isFinite(prNumber) || prNumber < 1) {
  console.error("Usage: syncChangelogPrToSanity.mjs <pr-number>");
  process.exit(1);
}

async function main() {
  const ghToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const pull = await fetchGitHubPullRequest(prNumber, ghToken);

  if (!pull) {
    console.log(`PR #${prNumber} not found.`);
    return;
  }

  if (!pull.merged_at) {
    console.log(`PR #${prNumber} is not merged — skipping.`);
    return;
  }

  if (hasSkipChangelogLabel(pull.labels)) {
    console.log(`PR #${prNumber} has skip-changelog — skipping.`);
    return;
  }

  const release = pullRequestToChangelogRelease(pull);
  if (!release) {
    console.log(`PR #${prNumber} could not be parsed — skipping.`);
    return;
  }

  const client = createSanityClientFromEnv();
  const id = await upsertChangelogRelease(client, release, {
    published: false,
    preservePublished: true,
    rawPrBody: pull.body ?? undefined
  });

  console.log(`Upserted draft ${id} for PR #${prNumber}.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
