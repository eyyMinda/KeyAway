/**
 * One-time backfill: create `vendor` docs and link each `program.vendor`.
 *
 * Run (Node 20.6+, loads .env.local for you):
 *   npm run backfill:vendors            # dry run (prints planned changes)
 *   npm run backfill:vendors -- --write # actually create vendors + link programs
 *
 * Idempotent:
 *   - Vendors are upserted by a deterministic id `vendor.<slug>` (createIfNotExists).
 *   - Existing `program.vendor` references are never overwritten.
 *
 * Requires env: NEXT_PUBLIC_SANITY_STUDIO_PROJECT_ID, NEXT_PUBLIC_SANITY_STUDIO_DATASET,
 * SANITY_API_TOKEN (write token), optional NEXT_PUBLIC_SANITY_STUDIO_API_VERSION.
 */
import { createClient } from "@sanity/client";

const WRITE = process.argv.includes("--write");

const projectId = process.env.NEXT_PUBLIC_SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_STUDIO_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_STUDIO_API_VERSION || "2025-09-07";
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !dataset) {
  console.error("Missing NEXT_PUBLIC_SANITY_STUDIO_PROJECT_ID / NEXT_PUBLIC_SANITY_STUDIO_DATASET.");
  process.exit(1);
}
if (WRITE && !token) {
  console.error("SANITY_API_TOKEN is required for --write.");
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

/** Explicit brand map (title lower-cased is tested for these substrings, first match wins). */
const BRAND_RULES = [
  { match: "iobit", name: "IObit" },
  { match: "itop", name: "iTop" },
  { match: "driver booster", name: "IObit" },
  { match: "advanced systemcare", name: "IObit" },
  { match: "smart defrag", name: "IObit" },
  { match: "malware fighter", name: "IObit" },
  { match: "aomei", name: "AOMEI" },
  { match: "easeus", name: "EaseUS" },
  { match: "wondershare", name: "Wondershare" },
  { match: "ashampoo", name: "Ashampoo" },
  { match: "wise", name: "WiseCleaner" },
  { match: "glary", name: "Glarysoft" },
  { match: "ccleaner", name: "Piriform" },
  { match: "avast", name: "Avast" },
  { match: "avg", name: "AVG" }
];

function slugify(input) {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Derive a vendor display name from a program title. */
function deriveVendorName(title) {
  const lower = String(title).toLowerCase();
  for (const rule of BRAND_RULES) {
    if (lower.includes(rule.match)) return rule.name;
  }
  // Fallback: first word, title-cased.
  const first = String(title).trim().split(/\s+/)[0] || "Unknown";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

async function main() {
  const programs = await client.fetch(
    `*[_type == "program"]{ _id, title, "slug": slug.current, "vendorRef": vendor._ref }`
  );

  const vendorsToCreate = new Map(); // slug -> name
  const links = []; // { programId, title, vendorId, vendorName }

  for (const p of programs) {
    const vendorName = deriveVendorName(p.title);
    const vendorSlug = slugify(vendorName);
    const vendorId = `vendor.${vendorSlug}`;
    if (!vendorsToCreate.has(vendorSlug)) vendorsToCreate.set(vendorSlug, vendorName);
    if (!p.vendorRef) {
      links.push({ programId: p._id, title: p.title, vendorId, vendorName });
    }
  }

  console.log(`Programs: ${programs.length}`);
  console.log(`Vendors (${vendorsToCreate.size}):`, [...vendorsToCreate.values()].join(", "));
  console.log(`Programs needing a vendor link: ${links.length}`);
  for (const l of links) console.log(`  - "${l.title}" -> ${l.vendorName}`);

  if (!WRITE) {
    console.log("\nDry run. Re-run with -- --write to apply.");
    return;
  }

  const tx = client.transaction();
  for (const [slug, name] of vendorsToCreate) {
    tx.createIfNotExists({
      _id: `vendor.${slug}`,
      _type: "vendor",
      name,
      slug: { _type: "slug", current: slug }
    });
  }
  for (const l of links) {
    // setIfMissing guards against overwriting a vendor set between fetch and commit.
    tx.patch(l.programId, patch =>
      patch.setIfMissing({ vendor: { _type: "reference", _ref: l.vendorId } })
    );
  }
  await tx.commit();
  console.log("\nDone. Publish drafts if any programs were drafts.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
