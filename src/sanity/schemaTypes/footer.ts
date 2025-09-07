import { defineType } from "sanity";

export const footer = defineType({
  name: "footer",
  title: "Footer",
  type: "document",
  fields: [
    {
      name: "isLogo",
      title: "Show Logo?",
      type: "boolean",
      initialValue: true
    },
    {
      name: "footerLinks",
      title: "Footer Links",
      type: "array",
      of: [{ type: "link" }]
    }
  ]
});
