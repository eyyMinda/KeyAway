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
      type: "reference",
      to: [{ type: "header" }]
    }),
    defineField({
      name: "footer",
      title: "Footer",
      type: "reference",
      to: [{ type: "footer" }]
    })
  ]
});
