import { defineField, defineType } from "sanity";

const feedItemFields = [
  defineField({ name: "id", type: "string", validation: Rule => Rule.required() }),
  defineField({
    name: "type",
    type: "string",
    options: {
      list: [
        { title: "New program", value: "new_program" },
        { title: "New program + keys", value: "new_program_with_keys" },
        { title: "New keys", value: "new_keys" }
      ],
      layout: "radio"
    },
    validation: Rule => Rule.required()
  }),
  defineField({ name: "programSlug", type: "string", validation: Rule => Rule.required() }),
  defineField({ name: "programTitle", type: "string", validation: Rule => Rule.required() }),
  defineField({ name: "message", type: "string" }),
  defineField({ name: "createdAt", type: "string", validation: Rule => Rule.required() }),
  defineField({ name: "imageUrl", type: "string" })
];

/** Append-only feed snapshots — each rebuild creates a new document when content changes. */
export const siteNotificationFeed = defineType({
  name: "siteNotificationFeed",
  title: "Site notification feed",
  type: "document",
  fields: [
    defineField({
      name: "generatedAt",
      title: "Generated at",
      type: "datetime",
      description: "When this snapshot was built (webhook/admin rebuild).",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "windowDays",
      title: "Activity window (days)",
      type: "number",
      description: "Program/key activity window used for this snapshot.",
      initialValue: 30,
      validation: Rule => Rule.min(1).max(365)
    }),
    defineField({
      name: "items",
      title: "Notifications",
      type: "array",
      description: "Capped list snapshot — do not hand-edit in production.",
      validation: Rule => Rule.max(50),
      of: [{ type: "object", fields: feedItemFields }]
    })
  ],
  preview: {
    select: {
      generatedAt: "generatedAt",
      count: "items"
    },
    prepare({ generatedAt, count }) {
      const n = Array.isArray(count) ? count.length : 0;
      return {
        title: generatedAt ? `Feed snapshot` : "Feed snapshot",
        subtitle: `${n} notification${n === 1 ? "" : "s"}`
      };
    }
  }
});
