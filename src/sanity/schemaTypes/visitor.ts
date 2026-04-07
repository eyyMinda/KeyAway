import { defineType } from "sanity";

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
    {
      name: "visitorHash",
      title: "Visitor hash",
      type: "string",
      description: "SHA-256 of IP + ANALYTICS_SALT (same as trackingEvent.ipHash)",
      validation: Rule => Rule.required()
    },
    {
      name: "visitCount",
      title: "Visit count (sessions)",
      type: "number",
      description: "Increments when last activity was more than 1 hour ago",
      initialValue: 1,
      validation: Rule => Rule.required().min(0)
    },
    {
      name: "lastActivityAt",
      title: "Last activity",
      type: "datetime",
      validation: Rule => Rule.required()
    },
    {
      name: "visitTier",
      title: "Visit tier",
      type: "string",
      options: { list: [...VISIT_TIERS] },
      initialValue: "new",
      validation: Rule => Rule.required()
    },
    {
      name: "isSpammer",
      title: "Spammer",
      type: "boolean",
      initialValue: false
    },
    {
      name: "reportCount",
      title: "Key reports submitted",
      type: "number",
      initialValue: 0,
      validation: Rule => Rule.required().min(0)
    },
    {
      name: "suggestionCount",
      title: "Key suggestions submitted",
      type: "number",
      initialValue: 0,
      validation: Rule => Rule.required().min(0)
    },
    {
      name: "contributionScore",
      title: "Contribution score",
      type: "number",
      description: "Incremented for each valid key report and key suggestion.",
      initialValue: 0,
      validation: Rule => Rule.required().min(0)
    },
    {
      name: "spamMarkedAt",
      title: "Marked spam at",
      type: "datetime"
    },
    {
      name: "createdAt",
      title: "Created at",
      type: "datetime",
      initialValue: () => new Date().toISOString()
    },
    {
      name: "updatedAt",
      title: "Updated at",
      type: "datetime",
      initialValue: () => new Date().toISOString()
    }
  ],
  preview: {
    select: { hash: "visitorHash", count: "visitCount", tier: "visitTier", spam: "isSpammer" },
    prepare({ hash, count, tier, spam }) {
      const short = typeof hash === "string" ? `${hash.slice(0, 10)}…` : "?";
      return {
        title: `${short} · ${count ?? 0} visits`,
        subtitle: [tier, spam ? "SPAMMER" : null].filter(Boolean).join(" · ")
      };
    }
  }
});
