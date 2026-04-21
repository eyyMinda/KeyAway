import { defineField, defineType } from "sanity";

import { portableTextHasContent, portableTextToPlainText } from "@/src/lib/portableText/toPlainText";

/** Optional bullet with optional icon image */
export const aboutPoint = defineType({
  name: "aboutPoint",
  title: "Point",
  type: "object",
  fields: [
    defineField({
      name: "text",
      title: "Text",
      type: "array",
      of: [{ type: "block" }],
      validation: Rule =>
        Rule.custom((value: unknown) =>
          portableTextHasContent(value) ? true : "Point text is required"
        )
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
    select: { t: "text", media: "icon" },
    prepare(selection) {
      const { t, media } = selection;
      const plain = portableTextToPlainText(t);
      const title = plain ? (plain.length > 60 ? `${plain.slice(0, 60)}…` : plain) : "Point";
      return { title, media };
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
      type: "array",
      of: [{ type: "block" }],
      description: "Required. Main copy for this block.",
      validation: Rule =>
        Rule.custom((value: unknown) =>
          portableTextHasContent(value) ? true : "Description is required"
        )
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
    select: { title: "sectionTitle", desc: "description", media: "image" },
    prepare(selection) {
      const { title, desc, media } = selection;
      const d = portableTextToPlainText(desc);
      return {
        title: (typeof title === "string" && title.trim()) || "About block",
        subtitle: d ? `${d.slice(0, 72)}${d.length > 72 ? "…" : ""}` : "",
        media
      };
    }
  }
});
