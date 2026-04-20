import { defineField, defineType } from "sanity";

const MAX_META_TITLE = 70;
const MAX_META_DESC = 160;

export const program = defineType({
  name: "program",
  title: "Program",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      description:
        "Short summary shown on the program page. Unique to this program; mention category and who it is for.",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "featuredDescription",
      title: "Featured Description",
      type: "text",
      description:
        "Optional description to display when this program is featured. Should include what the program does, its capabilities. If empty, the regular description will be used."
    }),
    defineField({
      name: "latestOfficialVersion",
      title: "Latest official version",
      type: "string",
      description:
        "Current product version from the vendor site (e.g. 18.5). Used for honest copy and SEO; CD keys keep their own version fields."
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "object",
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: "metaTitle",
          title: "Meta title override",
          type: "string",
          description: "Optional. Shown in search results and browser tab. Leave empty to use the automatic template.",
          validation: Rule =>
            Rule.max(MAX_META_TITLE).warning(`Prefer ${MAX_META_TITLE} characters or fewer for Google display.`)
        }),
        defineField({
          name: "metaDescription",
          title: "Meta description override",
          type: "text",
          rows: 3,
          description: "Optional. Shown under the title in search results.",
          validation: Rule =>
            Rule.max(MAX_META_DESC).warning(`Prefer ${MAX_META_DESC} characters or fewer for Google snippets.`)
        })
      ]
    }),
    defineField({
      name: "aboutSections",
      title: "About sections",
      type: "array",
      of: [{ type: "aboutSection" }],
      validation: Rule => Rule.max(4),
      description:
        "Optional (max 4). Each block has required description; optional title, image, bullet points, and layout toggles."
    }),
    defineField({
      name: "faq",
      title: "FAQ",
      type: "array",
      description:
        "Optional Q&A for this program only. Use at least 2 entries or leave empty (structured data requires 2+).",
      of: [
        {
          type: "object",
          name: "faqItem",
          fields: [
            defineField({
              name: "question",
              title: "Question",
              type: "string",
              validation: Rule => Rule.required()
            }),
            defineField({
              name: "answer",
              title: "Answer",
              type: "text",
              rows: 4,
              validation: Rule => Rule.required()
            })
          ],
          preview: {
            select: { title: "question" },
            prepare({ title }: { title?: string }) {
              return { title: title || "FAQ item" };
            }
          }
        }
      ],
      validation: Rule =>
        Rule.custom((items: unknown[] | undefined) => {
          const n = items?.length ?? 0;
          if (n === 1) {
            return "Add a second FAQ entry or remove FAQ items entirely (FAQ rich results need at least 2 questions).";
          }
          return true;
        })
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: {
        hotspot: true
      }
    }),
    defineField({
      name: "showcaseGif",
      title: "Showcase GIF",
      type: "image",
      description: "Optional GIF demonstrating the program in action (used when featured)"
    }),
    defineField({
      name: "downloadLink",
      title: "Download Link",
      type: "url",
      description: "External link for users to download the program"
    }),
    defineField({
      name: "cdKeys",
      title: "CD Keys",
      type: "array",
      of: [{ type: "cdKey" }],
      validation: Rule =>
        Rule.custom((keys: { key?: string }[] | undefined) => {
          if (!keys || keys.length === 0) return true;
          const normalized = (keys ?? [])
            .map(k => (typeof k?.key === "string" ? k.key.trim().toUpperCase().replace(/\s+/g, "") : ""))
            .filter(Boolean);
          const unique = new Set(normalized);
          if (unique.size < normalized.length) {
            return "Duplicate CD keys are not allowed within the same program.";
          }
          return true;
        })
    })
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "description",
      latestOfficialVersion: "latestOfficialVersion",
      media: "image"
    }
  }
});
