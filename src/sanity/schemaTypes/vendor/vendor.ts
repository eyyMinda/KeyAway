import { defineField, defineType } from "sanity";
import { VendorProgramsInput } from "@/src/sanity/inputs/VendorProgramsInput";

const MAX_META_TITLE = 70;
const MAX_META_DESC = 160;

export const vendor = defineType({
  name: "vendor",
  title: "Vendor",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: "Software publisher / brand shown on the hub page (e.g. IObit, iTop).",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "URL segment: /vendors/{slug}.",
      options: { source: "name" },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "array",
      of: [{ type: "block" }],
      description: "Intro copy shown on the /vendors/{slug} hub page."
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      options: { hotspot: true }
    }),
    defineField({
      name: "logoBackgroundColor",
      title: "Logo background color",
      type: "color",
      description: "Optional tile background behind transparent logos. Leave unset for a transparent background.",
      options: { disableAlpha: false },
      hidden: ({ document }) => !document?.logo
    }),
    defineField({
      name: "assignedProgramsUi",
      title: "Programs",
      type: "string",
      description: "Manage which programs belong to this vendor. Changes update each program's Vendor reference.",
      components: { input: VendorProgramsInput },
      hidden: ({ document }) => !document?._id
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "object",
      options: { collapsible: true, collapsed: true },
      description: "Optional search metadata overrides for this vendor hub page.",
      fields: [
        defineField({
          name: "metaTitle",
          title: "Meta title override",
          type: "string",
          validation: Rule =>
            Rule.max(MAX_META_TITLE).warning(`Prefer ${MAX_META_TITLE} characters or fewer for Google display.`)
        }),
        defineField({
          name: "metaDescription",
          title: "Meta description override",
          type: "text",
          rows: 3,
          validation: Rule =>
            Rule.max(MAX_META_DESC).warning(`Prefer ${MAX_META_DESC} characters or fewer for Google snippets.`)
        })
      ]
    }),
    defineField({
      name: "giveawayVsOfficial",
      title: "Giveaway key vs Official PRO",
      type: "array",
      of: [{ type: "giveawayComparisonRow" }],
      description:
        "Honest comparison of a community giveaway key (temporary, version-locked, activation-capped) vs an official PRO license. Shown on this vendor's hub page. Applies to every program from this vendor — no per-program overrides."
    })
  ],
  preview: {
    select: { title: "name", media: "logo" }
  }
});
