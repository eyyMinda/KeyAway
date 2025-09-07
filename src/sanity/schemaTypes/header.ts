import { defineType } from "sanity";

export const header = defineType({
  name: "header",
  title: "Header",
  type: "document",
  fields: [
    {
      name: "isLogo",
      title: "Show Logo?",
      type: "boolean",
      initialValue: true
    },
    {
      name: "headerLinks",
      title: "Header Links",
      type: "array",
      of: [{ type: "link" }]
    }
  ]
});
