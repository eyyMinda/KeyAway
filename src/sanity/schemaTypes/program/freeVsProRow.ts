import { defineField, defineType } from "sanity";

/**
 * Per-program "Free vs Official PRO" feature comparison row.
 * Used by `program.freeVsProComparison` to show what the free edition offers
 * versus the paid official PRO license (an SEO-friendly feature table).
 *
 * NOTE: this is the classic feature comparison. The giveaway-key caveats
 * (temporary, version-locked, activation-capped) live separately on the
 * vendor as `giveawayVsOfficial` (see `giveawayComparisonRow`).
 */
export const freeVsProRow = defineType({
  name: "freeVsProRow",
  title: "Free vs Official PRO row",
  type: "object",
  fields: [
    defineField({
      name: "feature",
      title: "Feature",
      type: "string",
      description: 'e.g. "Updates", "Speed", "Support".',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "free",
      title: "Free",
      type: "string",
      description: 'What the free edition offers, e.g. "Manual only".'
    }),
    defineField({
      name: "pro",
      title: "Official PRO",
      type: "string",
      description: 'What the paid PRO license adds, e.g. "Automatic & background".'
    })
  ],
  preview: {
    select: { title: "feature", free: "free", pro: "pro" },
    prepare({ title, free, pro }) {
      return {
        title: title || "Row",
        subtitle: [free, pro].filter(Boolean).join("  →  ") || undefined
      };
    }
  }
});
