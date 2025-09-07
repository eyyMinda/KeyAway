import { defineType } from "sanity";

export const link = defineType({
  name: "link",
  title: "Link",
  type: "object",
  fields: [
    {
      name: "title",
      title: "Link Title",
      type: "string",
      validation: Rule => Rule.required()
    },
    {
      name: "slug",
      title: "Slug / URL",
      type: "slug",
      options: { source: "title", maxLength: 50 },
      hidden: ({ parent }) => parent?.external === true
    },
    {
      name: "external",
      title: "External Link?",
      type: "boolean",
      description: "Check if this link is to an external site",
      initialValue: false
    },
    {
      name: "url",
      title: "External URL",
      type: "url",
      hidden: ({ parent }) => !parent?.external
    }
  ]
});
