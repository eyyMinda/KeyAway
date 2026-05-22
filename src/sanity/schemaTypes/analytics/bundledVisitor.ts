import { defineField, defineType } from "sanity";

const VISIT_TIERS = [
  { title: "New (0-1 sessions)", value: "new" },
  { title: "Returning (2-5)", value: "returning" },
  { title: "Regular (6-15)", value: "regular" },
  { title: "Star (16+ sessions & 5+ contributions)", value: "star" }
] as const;

/** Snapshot of a `visitor` row embedded in `visitorBundle.visitors`. */
export const bundledVisitor = defineType({
  name: "bundledVisitor",
  title: "Bundled visitor",
  type: "object",
  fields: [
    defineField({ name: "visitorHash", title: "Visitor hash", type: "string" }),
    defineField({ name: "visitCount", title: "Visit count", type: "number" }),
    defineField({ name: "lastActivityAt", title: "Last activity", type: "datetime" }),
    defineField({
      name: "visitTier",
      title: "Visit tier",
      type: "string",
      options: { list: [...VISIT_TIERS] }
    }),
    defineField({ name: "isSpammer", title: "Spammer", type: "boolean" }),
    defineField({ name: "reportCount", title: "Key reports", type: "number" }),
    defineField({ name: "suggestionCount", title: "Key suggestions", type: "number" }),
    defineField({ name: "contributionScore", title: "Contribution score", type: "number" }),
    defineField({ name: "spamMarkedAt", title: "Marked spam at", type: "datetime" }),
    defineField({ name: "country", title: "Country", type: "string" }),
    defineField({ name: "city", title: "City", type: "string" }),
    defineField({ name: "geoUpdatedAt", title: "Geo updated at", type: "datetime" }),
    defineField({ name: "createdAt", title: "Created at", type: "datetime" }),
    defineField({ name: "updatedAt", title: "Updated at", type: "datetime" })
  ],
  preview: {
    select: { hash: "visitorHash", count: "visitCount", tier: "visitTier", spam: "isSpammer" },
    prepare({ hash, count, tier, spam }: { hash?: string; count?: number; tier?: string; spam?: boolean }) {
      const short = typeof hash === "string" ? `${hash.slice(0, 10)}…` : "?";
      return {
        title: `${short} · ${count ?? 0} visits`,
        subtitle: [tier, spam ? "SPAMMER" : null].filter(Boolean).join(" · ")
      };
    }
  }
});
