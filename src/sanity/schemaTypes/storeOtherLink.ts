import { defineField, defineType } from "sanity";

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
          .custom((value, context) => {
            const kind = (context.parent as { kind?: string } | undefined)?.kind;
            if (!value || !kind) return true;
            const v = String(value).toLowerCase();
            if (kind === "buymeacoffee" && !v.includes("buymeacoffee.com")) {
              return "URL must contain buymeacoffee.com";
            }
            if (kind === "githubRepository" && !v.includes("github.com")) {
              return "URL must contain github.com";
            }
            return true;
          })
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
