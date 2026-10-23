/**
 * Prefill helper for the Claude Code `/prefill-program` and `/prefill-vendor` commands
 * (.claude/skills/prefill-*). Uses the same scraper and result format as the admin Prefill dialog.
 *
 * Scrape (prints the sources as prompt-friendly text plus KeyAway's existing vendors and categories):
 *   npm run prefill:scrape -- <url> [more urls] [--name "Driver Booster"]
 *
 * Check a written result before pasting it into the admin (prints what the admin will apply):
 *   npm run prefill:check -- .prefill/driver-booster.json
 *
 * Node 22.18+/24 runs the TypeScript sources directly (type stripping). Requires the Sanity env vars in
 * .env.local for the vendor/category lists; scraping works without them.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@sanity/client";
import { scrapeForPrefill } from "../src/lib/prefill/scrapePage.ts";
import { findPressKit, readPressKit } from "../src/lib/prefill/pressKit.ts";
import { findInstaller } from "../src/lib/versions/installerVersion.ts";
import { parsePrefillResult, scrapeToText } from "../src/lib/prefill/prefillFormat.ts";

const args = process.argv.slice(2);

if (args[0] === "--check") {
  const file = args[1];
  if (!file) {
    console.error("Usage: npm run prefill:check -- <file.json>");
    process.exit(1);
  }
  const parsed = parsePrefillResult(readFileSync(file, "utf8"));
  if (!parsed.ok) {
    console.error(`Invalid: ${parsed.error}`);
    process.exit(1);
  }
  const body = parsed.value.program ?? parsed.value.vendor ?? {};
  console.log(`Valid ${parsed.value.kind} result. Fields the admin can apply:`);
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue;
    const summary = Array.isArray(value) ? `${value.length} item(s)` : typeof value === "object" ? Object.keys(value).join(", ") : String(value).slice(0, 80);
    console.log(`- ${key}: ${summary}`);
  }
  process.exit(0);
}

const nameIndex = args.indexOf("--name");
const productName = nameIndex >= 0 ? args[nameIndex + 1] : undefined;
const urls = args.filter((a, i) => /^https?:\/\//i.test(a) && i !== nameIndex + 1);
if (!urls.length) {
  console.error('Usage: npm run prefill:scrape -- <url> [more urls] [--name "Product name"]');
  process.exit(1);
}

async function loadContext() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_STUDIO_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_STUDIO_DATASET;
  if (!projectId || !dataset) return null;
  const client = createClient({
    projectId,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_STUDIO_API_VERSION || "2025-09-07",
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
  });
  return client.fetch(`{
    "vendors": *[_type == "vendor" && !(_id in path("drafts.**"))] | order(name asc).name,
    "categories": *[_type == "programCategory" && !(_id in path("drafts.**"))] | order(title asc).title,
    "programs": *[_type == "program" && !(_id in path("drafts.**"))] | order(title asc).title
  }`);
}

/** Same extras as the admin (src/lib/prefill/collectSources.ts): press kit + installer version. */
async function extras({ urls: pageUrls, productName: name, pages }) {
  const kitUrl = await findPressKit(pageUrls, name).catch(() => null);
  const pressKit = kitUrl ? await readPressKit(kitUrl).catch(() => null) : null;
  const links = [pressKit?.downloadUrl, ...(pages[0]?.downloadLinks ?? [])].filter(Boolean);
  const installer = links.length ? await findInstaller([...new Set(links)]) : null;
  return { pressKit, installer };
}

const [scrape, context] = await Promise.all([scrapeForPrefill({ urls, productName, extras }), loadContext().catch(() => null)]);

if (context) {
  console.log("# KeyAway context");
  console.log(`Vendors: ${context.vendors.join(", ")}`);
  console.log(`Categories (pick from these only): ${context.categories.join(", ")}`);
  console.log(`Existing programs: ${context.programs.join(", ")}`);
  console.log("");
}
console.log("# Sources");
console.log(scrapeToText(scrape));
if (scrape.errors.length) {
  console.log("\n# Errors");
  for (const e of scrape.errors) console.log(`- ${e.url}: ${e.error}`);
}
