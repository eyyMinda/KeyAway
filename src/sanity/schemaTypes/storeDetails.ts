import { defineType } from "sanity";

export const storeDetails = defineType({
  name: "storeDetails",
  title: "Store Details",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Store Title",
      type: "string"
    },
    {
      name: "description",
      title: "Store Description",
      type: "text"
    },
    {
      name: "logo",
      title: "Logo",
      type: "image"
    },
    {
      name: "logoLight",
      title: "Logo Light (Optional)",
      type: "image"
    },
    {
      name: "header",
      title: "Header",
      type: "reference",
      to: [{ type: "header" }]
    },
    {
      name: "footer",
      title: "Footer",
      type: "reference",
      to: [{ type: "footer" }]
    }
  ]
});
