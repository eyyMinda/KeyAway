import { defineField, defineType } from "sanity";

/** Shared comparison row used by `vendor.freeVsProDefaults` and `program.freeVsProComparison`. */
export const freeVsProRow = defineType({
  name: "freeVsProRow",
  title: "Free vs PRO row",
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
      title: "Free / Giveaway",
      type: "string",
      description: 'e.g. "Manual only".'
    }),
    defineField({
      name: "pro",
      title: "PRO",
      type: "string",
      description: 'e.g. "Automatic & background".'
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
