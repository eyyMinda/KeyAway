import { defineField, defineType } from "sanity";

const VISIT_TIERS = [
  { title: "New (0-1 sessions)", value: "new" },
  { title: "Returning (2-5)", value: "returning" },
  { title: "Regular (6-15)", value: "regular" },
  { title: "Star (16+ sessions & 5+ contributions)", value: "star" }
] as const;

export const visitor = defineType({
  name: "visitor",
  title: "Visitor",
  type: "document",
  fields: [
    defineField({
      name: "visitorHash",
      title: "Visitor hash",
      type: "string",
      description: "SHA-256 of IP + ANALYTICS_SALT (same as trackingEvent.ipHash)",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "visitCount",
      title: "Visit count (sessions)",
      type: "number",
      description: "Increments when last activity was more than 1 hour ago",
      initialValue: 1,
      validation: Rule => Rule.required().min(0)
    }),
    defineField({
      name: "lastActivityAt",
      title: "Last activity",
      type: "datetime",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "visitTier",
      title: "Visit tier",
      type: "string",
      options: { list: [...VISIT_TIERS] },
      initialValue: "new",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "isSpammer",
      title: "Spammer",
      type: "boolean",
      initialValue: false
    }),
    defineField({
      name: "reportCount",
      title: "Key reports submitted",
      type: "number",
      initialValue: 0,
      validation: Rule => Rule.required().min(0)
    }),
    defineField({
      name: "suggestionCount",
      title: "Key suggestions submitted",
      type: "number",
      initialValue: 0,
      validation: Rule => Rule.required().min(0)
    }),
    defineField({
      name: "contributionScore",
      title: "Contribution score",
      type: "number",
      description: "Incremented for each valid key report and key suggestion.",
      initialValue: 0,
      validation: Rule => Rule.required().min(0)
    }),
    defineField({
      name: "spamMarkedAt",
      title: "Marked spam at",
      type: "datetime"
    }),
    defineField({
      name: "country",
      title: "Country",
      type: "string",
      description: "Latest resolved visitor country from IP geolocation"
    }),
    defineField({
      name: "city",
      title: "City",
      type: "string",
      description: "Latest resolved visitor city from IP geolocation"
    }),
    defineField({
      name: "geoUpdatedAt",
      title: "Geo updated at",
      type: "datetime"
    }),
    defineField({
      name: "createdAt",
      title: "Created at",
      type: "datetime",
      initialValue: () => new Date().toISOString()
    }),
    defineField({
      name: "updatedAt",
      title: "Updated at",
      type: "datetime",
      initialValue: () => new Date().toISOString()
    })
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
