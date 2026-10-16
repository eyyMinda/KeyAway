#!/usr/bin/env node
/**
 * One-off: delete the old analytics documents from Sanity (now stored in Supabase). Delete this script afterwards.
 *
 *   npm run cleanup:sanity-analytics              # dry run: counts only
 *   npm run cleanup:sanity-analytics -- --confirm # delete
 *
 * Refuses to delete unless Supabase holds the imported history.
 */
import postgres from "postgres";
import { createSanityClientFromEnv } from "./changelogSyncUtils.mjs";

const confirm = process.argv.includes("--confirm");
const BATCH = 100;

const TYPES = [
  "trackingSession",
  "trackingSessionBundle",
  "visitor",
  "visitorBundle",
  "keyReport",
  "keyReportBundle",
  "analyticsMigration",
  "trackingEvent",
  "trackingEventBundle",
  "interactionEventBucket"
];
/** Run logs of the removed bundling crons. */
const OLD_CRON_JOBS = ["bundle-sessions", "bundle-visitors", "bundle-key-reports"];

const groups = [
  ...TYPES.map(type => ({ label: type, filter: `_type == "${type}"` })),
  { label: "cronRun (bundle-*)", filter: `_type == "cronRun" && job in ${JSON.stringify(OLD_CRON_JOBS)}` }
];

async function countAll(client) {
  const query = `{ ${groups.map((g, i) => `"g${i}": count(*[${g.filter}])`).join(", ")} }`;
  const counts = await client.fetch(query);
  return groups.map((g, i) => ({ ...g, count: counts[`g${i}`] ?? 0 }));
}

async function assertSupabaseHasHistory() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL is required (safety check that the history was imported).");
  const sql = postgres(url, { prepare: false, max: 1 });
  try {
    const [row] = await sql`
      select
        (select count(*)::int from analytics.sessions where origin like 'sanity%') as sessions,
        (select count(*)::int from analytics.visitors where origin like 'sanity%') as visitors,
        (select count(*)::int from analytics.key_reports where origin like 'sanity%') as key_reports
    `;
    console.log(`Supabase imported rows: ${row.sessions} sessions, ${row.visitors} visitors, ${row.key_reports} key reports`);
    if (!row.sessions || !row.visitors || !row.key_reports) {
      throw new Error("Supabase is missing imported history; not deleting anything.");
    }
  } finally {
    await sql.end();
  }
}

async function main() {
  const client = createSanityClientFromEnv();
  const before = await countAll(client);
  console.table(before.map(({ label, count }) => ({ type: label, documents: count })));
  const total = before.reduce((n, g) => n + g.count, 0);

  if (!total) {
    console.log("Nothing to delete.");
    return;
  }
  if (!confirm) {
    console.log(`Dry run: ${total} documents would be deleted. Re-run with --confirm to delete.`);
    return;
  }

  await assertSupabaseHasHistory();

  for (const group of before.filter(g => g.count > 0)) {
    const ids = await client.fetch(`*[${group.filter}]._id`);
    for (let i = 0; i < ids.length; i += BATCH) {
      const tx = client.transaction();
      for (const id of ids.slice(i, i + BATCH)) tx.delete(id);
      await tx.commit({ visibility: "async" });
    }
    console.log(`Deleted ${ids.length} × ${group.label}`);
  }

  const left = (await countAll(client)).reduce((n, g) => n + g.count, 0);
  console.log(left ? `${left} documents still visible (indexing can lag a few seconds; re-run to check).` : "Done: no analytics documents left in Sanity.");
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
