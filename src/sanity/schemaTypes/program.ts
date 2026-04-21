import { defineField, defineType } from "sanity";

import { portableTextToPlainText } from "@/src/lib/portableText/toPlainText";
import { CdKeysArrayInput } from "../inputs/CdKeysArrayInput";

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
      name: "latestOfficialVersion",
      title: "Latest official version",
      type: "string",
      description:
        "Current product version from the vendor site (e.g. 18.5). Used for honest copy and SEO; CD keys keep their own version fields."
    }),
    defineField({
      name: "downloadLink",
      title: "Download Link",
      type: "url",
      description: "External link for users to download the program"
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "array",
      of: [{ type: "block" }],
      description:
        "Short summary shown on the program page. Unique to this program; mention category and who it is for.",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "object",
      options: { collapsible: true, collapsed: true },
      description: "Optional search metadata overrides for this program (title/description shown in search results).",
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
      name: "image",
      title: "Image",
      type: "image",
      options: {
        hotspot: true
      }
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
            select: { question: "question", answer: "answer" },
            prepare(selection) {
              const { question, answer } = selection;
              const q = typeof question === "string" ? question.trim() : "";
              const a = typeof answer === "string" ? answer.trim().replace(/\s+/g, " ") : "";
              return {
                title: q || "FAQ item",
                subtitle: a ? (a.length > 96 ? `${a.slice(0, 96)}…` : a) : undefined
              };
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
      name: "featured",
      title: "Featured Section",
      type: "object",
      options: { collapsible: true, collapsed: true },
      description: "Optional: Overrides for featured section for this program (copy + GIF).",
      fields: [
        defineField({
          name: "featuredDescription",
          title: "Featured Description",
          type: "text",
          description:
            "Optional description when this program is featured on the homepage. If empty, the regular description is used."
        }),
        defineField({
          name: "showcaseGif",
          title: "Showcase GIF",
          type: "image",
          description: "Optional GIF demonstrating the program (shown when featured)."
        })
      ],
      preview: {
        select: {
          featuredDescription: "featuredDescription",
          media: "showcaseGif"
        },
        prepare(selection) {
          const desc = typeof selection.featuredDescription === "string" ? selection.featuredDescription.trim() : "";
          const subtitle = desc ? (desc.length > 72 ? `${desc.slice(0, 72)}…` : desc) : "No featured description";
          return {
            title: "Featured Section",
            subtitle,
            media: selection.media
          };
        }
      }
    }),
    defineField({
      name: "cdKeys",
      title: "CD Keys",
      type: "array",
      of: [{ type: "cdKey" }],
      components: { input: CdKeysArrayInput },
      validation: Rule =>
        Rule.custom((keys: { key?: string; status?: string }[] | undefined) => {
          if (!keys || keys.length === 0) return true;
          const allowed = new Set(["new", "active", "expired", "limit"]);
          for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            const label = `Key #${i + 1}`;
            if (typeof k?.key !== "string" || !k.key.trim()) {
              return `${label}: key text is required.`;
            }
            if (typeof k?.status !== "string" || !k.status.trim()) {
              return `${label}: status is required (New / Active / Expired / Limit).`;
            }
            if (!allowed.has(k.status.trim().toLowerCase())) {
              return `${label}: status must be one of new, active, expired, limit.`;
            }
          }
          const normalized = keys
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
      description: "description",
      latestOfficialVersion: "latestOfficialVersion",
      media: "image",
      cdKeys: "cdKeys"
    },
    prepare(selection) {
      const { title, description, latestOfficialVersion, media, cdKeys } = selection;
      const n = Array.isArray(cdKeys) ? cdKeys.length : 0;
      const keyLine = `${n} CD key${n === 1 ? "" : "s"}`;
      const versionPart =
        typeof latestOfficialVersion === "string" && latestOfficialVersion.trim()
          ? `v${latestOfficialVersion.trim()}`
          : null;
      const descPlain = portableTextToPlainText(description);
      const descPart = descPlain ? (descPlain.length > 72 ? `${descPlain.slice(0, 72)}…` : descPlain) : null;
      const subtitle = [keyLine, versionPart, descPart].filter(Boolean).join(" · ");
      return {
        title: title || "Program",
        subtitle: subtitle || keyLine,
        media
      };
    }
  }
});
