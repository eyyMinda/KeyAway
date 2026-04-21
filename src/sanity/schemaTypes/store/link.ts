import { defineField, defineType } from "sanity";

export const link = defineType({
  name: "link",
  title: "Link",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Link Title",
      type: "string",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "slug",
      title: "Slug / URL",
      type: "slug",
      options: { source: "title", maxLength: 50 },
      hidden: ({ parent }) => parent?.external === true
    }),
    defineField({
      name: "external",
      title: "External Link?",
      type: "boolean",
      description: "Check if this link is to an external site",
      initialValue: false
    }),
    defineField({
      name: "url",
      title: "External URL",
      type: "url",
      hidden: ({ parent }) => !parent?.external
    })
  ]
});
