import { defineField, defineType } from "sanity";

import { portableTextToPlainText } from "@/src/lib/portableText/toPlainText";
import {
  validateFaqNotExactlyOne,
  validatePortableTextRequired,
  validateProgramActivationEntries
} from "@/src/sanity/validators/program";
import { CdKeysArrayInput } from "../../inputs/CdKeysArrayInput";

const MAX_META_TITLE = 70;
const MAX_META_DESC = 160;

export const faqItem = defineType({
  name: "faqItem",
  title: "FAQ item",
  type: "object",
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
      type: "array",
      of: [{ type: "block" }],
      validation: Rule => Rule.custom(value => validatePortableTextRequired(value, "Answer is required"))
    })
  ],
  preview: {
    select: { question: "question", answer: "answer" },
    prepare(selection) {
      const { question, answer } = selection;
      const q = typeof question === "string" ? question.trim() : "";
      const a = portableTextToPlainText(answer);
      const subtitle = a ? (a.length > 96 ? `${a.slice(0, 96)}…` : a) : undefined;
      return {
        title: q || "FAQ item",
        subtitle
      };
    }
  }
});

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
      name: "programFlow",
      title: "Activation flow",
      type: "string",
      description:
        "How users get PRO access: classic CD keys, signup-giveaway keys, shared PRO accounts, or links to claim accounts.",
      options: {
        list: [
          { title: "CD keys (default)", value: "cd_key" },
          { title: "Link-based CD keys (giveaway → private key)", value: "link_based_cdkey" },
          { title: "PRO account (username + password)", value: "account" },
          { title: "Links to get PRO account", value: "link_based_account" }
        ],
        layout: "radio"
      },
      initialValue: "cd_key",
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
      validation: Rule => Rule.custom(value => validatePortableTextRequired(value, "Description is required"))
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
        }),
        defineField({
          name: "metaKeywords",
          title: "Meta keywords",
          type: "array",
          of: [{ type: "string" }],
          description: "Optional. Each row can use [title] for the store name from Store Details."
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
      of: [{ type: "faqItem" }],
      validation: Rule => Rule.custom(items => validateFaqNotExactlyOne(items))
    }),
    defineField({
      name: "featured",
      title: "Featured Section",
      type: "object",
      options: { collapsible: true, collapsed: true },
      description: "Optional: Overrides for featured section for this program (copy + GIF).",
      fields: [
        defineField({
          name: "description",
          title: "Featured description",
          type: "array",
          of: [{ type: "block" }],
          description:
            "Optional copy when this program is featured on the homepage. If empty, the regular description is used."
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
          desc: "description",
          media: "showcaseGif"
        },
        prepare(selection) {
          const plain = portableTextToPlainText(selection.desc);
          const subtitle = plain
            ? plain.length > 72
              ? `${plain.slice(0, 72)}…`
              : plain
            : "No featured description";
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
      title: "Activation entries",
      description: "Keys, accounts, or giveaway links depending on Activation flow above.",
      type: "array",
      of: [{ type: "cdKey" }],
      components: { input: CdKeysArrayInput },
      validation: Rule =>
        Rule.custom((keys, context) =>
          validateProgramActivationEntries(keys, (context.document as { programFlow?: string } | undefined)?.programFlow)
        )
    })
  ],
  preview: {
    select: {
      title: "title",
      description: "description",
      latestOfficialVersion: "latestOfficialVersion",
      media: "image",
      cdKeys: "cdKeys",
      programFlow: "programFlow"
    },
    prepare(selection) {
      const { title, description, latestOfficialVersion, media, cdKeys, programFlow } = selection;
      const n = Array.isArray(cdKeys) ? cdKeys.length : 0;
      const flow = typeof programFlow === "string" ? programFlow : "cd_key";
      const keyLine =
        flow === "account"
          ? `${n} account${n === 1 ? "" : "s"}`
          : flow === "link_based_account"
            ? `${n} link set${n === 1 ? "" : "s"}`
            : `${n} key${n === 1 ? "" : "s"}`;
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
