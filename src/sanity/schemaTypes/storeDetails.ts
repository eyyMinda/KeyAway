import { defineField, defineType } from "sanity";
import { validateStoreSiteUrl } from "@/src/sanity/validators/storeSiteUrl";

export const storeDetails = defineType({
  name: "storeDetails",
  title: "Store Details",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Store Title",
      type: "string"
    }),
    defineField({
      name: "supportEmail",
      title: "Support email",
      type: "string",
      description:
        "Public contact address for help links and the “report error” mailto. Leave empty to use the built-in default (support@keyaway.app).",
      validation: Rule =>
        Rule.custom((value: string | undefined) => {
          const v = typeof value === "string" ? value.trim() : "";
          if (!v) return true;
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address";
          return true;
        })
    }),
    defineField({
      name: "description",
      title: "Store Description",
      type: "array",
      of: [{ type: "block" }]
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image"
    }),
    defineField({
      name: "logoLight",
      title: "Logo Light (Optional)",
      type: "image"
    }),
    defineField({
      name: "seo",
      title: "SEO & social defaults",
      type: "object",
      options: { collapsible: true, collapsed: true },
      description:
        "Optional overrides for search and social defaults. Use [title] anywhere you want the store name (from Store Title above, or KeyAway if that is empty). Leave a field empty to keep the built-in default for that field.",
      fields: [
        defineField({
          name: "siteUrl",
          title: "Site / canonical base URL",
          type: "url",
          description:
            "Your live site origin, normally https://www.keyaway.app. Used for canonical URLs and JSON-LD. Leave empty to use that default.",
          validation: Rule => Rule.custom(value => validateStoreSiteUrl(value))
        }),
        defineField({
          name: "sharingImage",
          title: "Default Open Graph image",
          type: "image",
          description: "Shown when a page has no specific image (home, programs list, etc.). Recommended 1200×630."
        }),
        defineField({
          name: "homeMetaTitle",
          title: "Home meta title",
          type: "string",
          description: 'Example: "[title] - Free CD Keys for Premium Software"'
        }),
        defineField({
          name: "homeMetaDescription",
          title: "Home meta description",
          type: "text",
          rows: 3
        }),
        defineField({
          name: "homeMetaKeywords",
          title: "Home meta keywords",
          type: "array",
          of: [{ type: "string" }],
          description: "Optional. Each line can include [title]."
        }),
        defineField({
          name: "programsMetaTitle",
          title: "Programs listing meta title",
          type: "string",
          description: 'Example: "All Programs - [title]"'
        }),
        defineField({
          name: "programsMetaDescription",
          title: "Programs listing meta description",
          type: "text",
          rows: 3
        }),
        defineField({
          name: "programsMetaKeywords",
          title: "Programs listing meta keywords",
          type: "array",
          of: [{ type: "string" }]
        }),
        defineField({
          name: "privacyMetaTitle",
          title: "Privacy page meta title",
          type: "string"
        }),
        defineField({
          name: "privacyMetaDescription",
          title: "Privacy page meta description",
          type: "text",
          rows: 3
        }),
        defineField({
          name: "privacyMetaKeywords",
          title: "Privacy page meta keywords",
          type: "array",
          of: [{ type: "string" }]
        }),
        defineField({
          name: "termsMetaTitle",
          title: "Terms page meta title",
          type: "string"
        }),
        defineField({
          name: "termsMetaDescription",
          title: "Terms page meta description",
          type: "text",
          rows: 3
        }),
        defineField({
          name: "termsMetaKeywords",
          title: "Terms page meta keywords",
          type: "array",
          of: [{ type: "string" }]
        })
      ]
    }),
    defineField({
      name: "header",
      title: "Header",
      type: "object",
      fields: [
        defineField({
          name: "isLogo",
          title: "Show Logo?",
          type: "boolean",
          initialValue: true
        }),
        defineField({
          name: "headerLinks",
          title: "Header Links",
          type: "array",
          of: [{ type: "link" }]
        })
      ]
    }),
    defineField({
      name: "footer",
      title: "Footer",
      type: "object",
      fields: [
        defineField({
          name: "isLogo",
          title: "Show Logo?",
          type: "boolean",
          initialValue: true
        }),
        defineField({
          name: "footerLinks",
          title: "Footer Links",
          type: "array",
          of: [{ type: "link" }]
        })
      ]
    }),
    defineField({
      name: "socialLinks",
      title: "Social links",
      type: "array",
      of: [{ type: "storeSocialEntry" }],
      description: "Social profiles shown in the header menu and footer."
    }),
    defineField({
      name: "otherLinks",
      title: "Other links",
      type: "array",
      of: [{ type: "storeOtherLink" }],
      description:
        "Support and repo URLs. Use the matching type for Buy Me a Coffee and GitHub (Studio checks the domain on those). “Other” is only shown as generic links in the UI."
    })
  ]
});
