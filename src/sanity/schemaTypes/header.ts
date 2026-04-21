import { defineField, defineType } from "sanity";

export const header = defineType({
  name: "header",
  title: "Header",
  type: "document",
  fields: [
    defineField({
      name: "isLogo",
      title: "Show Logo?",
      type: "boolean",
      initialValue: true
    }),
    defineField({
      name: "headerLinks",
      title: "Header Links",
      type: "array",
      of: [{ type: "link" }]
    })
  ]
});
