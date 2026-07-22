import { defineField, defineType } from "sanity";

export const programCategory = defineType({
  name: "programCategory",
  title: "Program category",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "Display name (e.g. Driver tools, System cleanup).",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
      validation: Rule => Rule.required()
    })
  ],
  preview: {
    select: { title: "title", slug: "slug" },
    prepare({ title, slug }) {
      const t = typeof title === "string" ? title.trim() : "";
      const s = slug?.current;
      return {
        title: t || "Category",
        subtitle: s ? `/${s}` : undefined
      };
    }
  }
});
