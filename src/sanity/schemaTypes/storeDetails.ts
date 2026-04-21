import { defineField, defineType } from "sanity";

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
      name: "description",
      title: "Store Description",
      type: "text"
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
    })
  ]
});
