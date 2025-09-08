import { defineType } from "sanity";

export const trackingEvent = defineType({
  name: "trackingEvent",
  title: "Tracking Event",
  type: "document",
  fields: [
    {
      name: "event",
      title: "Event Name",
      type: "string",
      options: {
        list: [
          { title: "Copy CD Key", value: "copy_cdkey" },
          { title: "Download Click", value: "download_click" },
          { title: "Social Click", value: "social_click" }
        ]
      },
      validation: Rule => Rule.required()
    },
    { name: "programSlug", title: "Program Slug", type: "string" },
    { name: "keyMasked", title: "Key (Masked)", type: "string" },
    { name: "social", title: "Social Name", type: "string" },
    { name: "path", title: "Path", type: "string" },
    { name: "referrer", title: "Referrer", type: "url" },
    { name: "userAgent", title: "User Agent", type: "string" },
    {
      name: "ipHash",
      title: "Visitor Hash",
      type: "string",
      description: "Hashed IP + salt. Used for deduping without storing raw IP."
    },
    {
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString()
    }
  ]
});
