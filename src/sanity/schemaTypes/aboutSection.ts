import { defineField, defineType } from "sanity";

/** Optional bullet with optional icon image */
export const aboutPoint = defineType({
  name: "aboutPoint",
  title: "Point",
  type: "object",
  fields: [
    defineField({
      name: "text",
      title: "Text",
      type: "string",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "icon",
      title: "Icon (optional)",
      type: "image",
      options: { hotspot: true },
      description: "Small icon next to this line (e.g. PNG/SVG)."
    })
  ],
  preview: {
    select: { t: "text" },
    prepare({ t }: { t?: string }) {
      return { title: t || "Point" };
    }
  }
});

/** One about block: image + copy (max 4 per program) */
export const aboutSection = defineType({
  name: "aboutSection",
  title: "About block",
  type: "object",
  fields: [
    defineField({
      name: "sectionTitle",
      title: "Title (optional)",
      type: "string",
      description: "Optional heading above the description."
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 6,
      description: "Required. Main copy for this block.",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "image",
      title: "Image (optional)",
      type: "image",
      options: { hotspot: true },
      description: "If set, shows side-by-side with text on large screens. If empty, text is centered."
    }),
    defineField({
      name: "invertDesktop",
      title: "Desktop: put image on the right",
      type: "boolean",
      initialValue: false,
      description: "Off = image left, text right. On = swapped."
    }),
    defineField({
      name: "invertMobile",
      title: "Mobile: put image below text",
      type: "boolean",
      initialValue: false,
      description: "Off = image above text. On = image under the text."
    }),
    defineField({
      name: "points",
      title: "Points (optional)",
      type: "array",
      of: [{ type: "aboutPoint" }],
      description: "Optional bullet list below the description."
    })
  ],
  preview: {
    select: { title: "sectionTitle", desc: "description" },
    prepare({ title, desc }: { title?: string; desc?: string }) {
      return {
        title: title || "About block",
        subtitle: desc?.slice(0, 72) ?? ""
      };
    }
  }
});
