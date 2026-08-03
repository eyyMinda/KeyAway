import { CHANGELOG_TAGS } from "@/src/lib/changelog/changelogTags";
import { defineField, defineType } from "sanity";

const tagOptions = CHANGELOG_TAGS.map(tag => ({ title: tag, value: tag }));

export const changelogRelease = defineType({
  name: "changelogRelease",
  title: "Changelog",
  type: "document",
  fields: [
    defineField({
      name: "prNumber",
      title: "Pull request #",
      type: "number",
      validation: Rule => Rule.required().integer().min(1)
    }),
    defineField({
      name: "releasedAt",
      title: "Released at",
      type: "datetime",
      description: "PR merge time (UTC).",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 4,
      validation: Rule =>
        Rule.custom((value, context) => {
          const published = (context.document as { published?: boolean } | undefined)?.published;
          if (published && (!value || !String(value).trim())) {
            return "Summary is required before publishing.";
          }
          return true;
        })
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: { list: tagOptions },
      validation: Rule => Rule.required().min(1)
    }),
    defineField({
      name: "highlights",
      title: "Highlights",
      type: "array",
      of: [{ type: "string" }]
    }),
    defineField({
      name: "sections",
      title: "Sections",
      type: "array",
      of: [
        {
          type: "object",
          name: "changelogSection",
          fields: [
            defineField({ name: "title", type: "string", validation: Rule => Rule.required() }),
            defineField({
              name: "items",
              type: "array",
              of: [{ type: "string" }],
              validation: Rule => Rule.required().min(1)
            })
          ],
          preview: {
            select: { title: "title", items: "items" },
            prepare({ title, items }) {
              const n = Array.isArray(items) ? items.length : 0;
              return { title: title || "Section", subtitle: `${n} item${n === 1 ? "" : "s"}` };
            }
          }
        }
      ]
    }),
    defineField({
      name: "published",
      title: "Published",
      type: "boolean",
      description: "Only published releases appear on /changelog.",
      initialValue: false
    }),
    defineField({
      name: "rawPrBody",
      title: "Raw PR body (dev)",
      type: "text",
      rows: 8,
      readOnly: true,
      hidden: ({ document }) => !document?.rawPrBody
    })
  ],
  orderings: [
    {
      title: "Release date (newest)",
      name: "releasedAtDesc",
      by: [{ field: "releasedAt", direction: "desc" }]
    }
  ],
  preview: {
    select: {
      title: "title",
      prNumber: "prNumber",
      releasedAt: "releasedAt",
      published: "published"
    },
    prepare({ title, prNumber, releasedAt, published }) {
      const date = releasedAt ? new Date(releasedAt).toLocaleDateString("en-US") : "";
      return {
        title: title || `PR #${prNumber}`,
        subtitle: `PR #${prNumber}${date ? ` · ${date}` : ""}${published ? "" : " · draft"}`
      };
    }
  }
});
