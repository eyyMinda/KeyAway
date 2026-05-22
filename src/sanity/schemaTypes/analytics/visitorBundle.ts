import { defineField, defineType } from "sanity";

export const visitorBundle = defineType({
  name: "visitorBundle",
  title: "Visitor Bundle",
  type: "document",
  fields: [
    defineField({
      name: "updatedAt",
      title: "Updated At",
      type: "datetime",
      description: "Last time cron added visitors to this bundle",
      readOnly: true
    }),
    defineField({
      name: "bundledAt",
      title: "Bundled At",
      type: "datetime",
      readOnly: true
    }),
    defineField({
      name: "timeRangeStart",
      title: "Time Range Start",
      type: "datetime",
      description: "Oldest lastActivityAt in this bundle"
    }),
    defineField({
      name: "timeRangeEnd",
      title: "Time Range End",
      type: "datetime",
      description: "Newest lastActivityAt in this bundle"
    }),
    defineField({
      name: "visitorCount",
      title: "Visitor Count",
      type: "number",
      description: "Number of visitors in this bundle"
    }),
    defineField({
      name: "visitors",
      title: "Visitors",
      type: "array",
      of: [{ type: "bundledVisitor" }]
    })
  ]
});
