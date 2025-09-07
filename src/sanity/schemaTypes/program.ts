import { defineType } from "sanity";

export const program = defineType({
  name: "program",
  title: "Program",
  type: "document",
  fields: [
    { name: "title", title: "Title", type: "string", validation: Rule => Rule.required() },
    { name: "slug", title: "Slug", type: "slug", options: { source: "title" }, validation: Rule => Rule.required() },
    { name: "description", title: "Description", type: "text", validation: Rule => Rule.required() },
    {
      name: "image",
      title: "Image",
      type: "image",
      options: {
        hotspot: true
      }
    },
    {
      name: "downloadLink",
      title: "Download Link",
      type: "url",
      description: "External link for users to download the program"
    },
    {
      name: "cdKeys",
      title: "CD Keys",
      type: "array",
      of: [{ type: "cdKey" }]
    }
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "description",
      media: "image"
    }
  }
});
