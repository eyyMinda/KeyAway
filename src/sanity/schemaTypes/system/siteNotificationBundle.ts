import { defineField, defineType } from "sanity";

const historyItemFields = [
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

/** Bundled catalog update events for /updates history (bell uses singleton siteNotificationFeed). */
export const siteNotificationBundle = defineType({
  name: "siteNotificationBundle",
  title: "Site notification history bundle",
  type: "document",
  fields: [
    defineField({
      name: "bundledAt",
      title: "Bundled at",
      type: "datetime",
      readOnly: true
    }),
    defineField({
      name: "timeRangeStart",
      title: "Time range start",
      type: "datetime",
      description: "Oldest event timestamp in this bundle"
    }),
    defineField({
      name: "timeRangeEnd",
      title: "Time range end",
      type: "datetime",
      description: "Newest event timestamp in this bundle"
    }),
    defineField({
      name: "eventCount",
      title: "Event count",
      type: "number",
      readOnly: true
    }),
    defineField({
      name: "capacity",
      title: "Capacity",
      type: "number",
      description: "Max events before cron/rebuild opens a new bundle.",
      readOnly: true,
      initialValue: 500
    }),
    defineField({
      name: "items",
      title: "Events",
      type: "array",
      of: [{ type: "object", fields: historyItemFields }],
      validation: Rule => Rule.max(500)
    })
  ],
  preview: {
    select: { timeRangeEnd: "timeRangeEnd", eventCount: "eventCount" },
    prepare({ timeRangeEnd, eventCount }) {
      const n = typeof eventCount === "number" ? eventCount : 0;
      const end = timeRangeEnd ? new Date(timeRangeEnd).toLocaleDateString("en-US") : "—";
      return { title: `Notification bundle (${n})`, subtitle: `Through ${end}` };
    }
  }
});
