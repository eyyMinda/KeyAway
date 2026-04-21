import { defineField, defineType } from "sanity";
import { validateStoreOtherLinkUrl } from "@/src/sanity/validators/store";

export const storeOtherLink = defineType({
  name: "storeOtherLink",
  title: "Other link",
  type: "object",
  fields: [
    defineField({
      name: "kind",
      title: "Link type",
      type: "string",
      options: {
        list: [
          { title: "Buy Me a Coffee", value: "buymeacoffee" },
          { title: "GitHub repository", value: "githubRepository" },
          { title: "Other", value: "other" }
        ],
        layout: "radio"
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "url",
      title: "URL",
      type: "url",
      validation: Rule =>
        Rule.required()
          .uri({ scheme: ["http", "https"] })
          .custom((value, context) =>
            validateStoreOtherLinkUrl(value, (context.parent as { kind?: string } | undefined)?.kind)
          )
    })
  ],
  preview: {
    select: { kind: "kind", url: "url" },
    prepare({ kind, url }) {
      return {
        title: kind === "buymeacoffee" ? "Buy Me a Coffee" : kind === "githubRepository" ? "GitHub" : "Other",
        subtitle: url
      };
    }
  }
});
