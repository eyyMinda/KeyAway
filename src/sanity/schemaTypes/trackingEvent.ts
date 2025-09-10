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
          { title: "Social Click", value: "social_click" },
          { title: "Page Viewed", value: "page_viewed" },
          { title: "Report Expired CD Key", value: "report_expired_cdkey" }
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
      name: "country",
      title: "Country",
      type: "string",
      description: "User's country based on IP geolocation"
    },
    {
      name: "city",
      title: "City",
      type: "string",
      description: "User's city based on IP geolocation"
    },
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
