import { defineType } from "sanity";

export const program = defineType({
  name: "program",
  title: "Program",
  type: "document",
  fields: [
    { name: "title", title: "Title", type: "string" },
    { name: "slug", title: "Slug", type: "slug", options: { source: "title" } },
    { name: "description", title: "Description", type: "text" },
    { name: "image", title: "Image", type: "image" },
    {
      name: "cdKeys",
      title: "CD Keys",
      type: "array",
      of: [{ type: "cdKey" }]
    }
  ]
});
