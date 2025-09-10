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
    { name: "keyHash", title: "Key Hash", type: "string", description: "SHA-256 hash of the CD key for privacy" },
    { name: "keyIdentifier", title: "Key Identifier", type: "string", description: "Short identifier like ABC***XYZ" },
    { name: "keyNormalized", title: "Key Normalized", type: "string", description: "Normalized key for matching" },
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
      name: "utm_source",
      title: "UTM Source",
      type: "string",
      description: "UTM source parameter from URL"
    },
    {
      name: "utm_medium",
      title: "UTM Medium",
      type: "string",
      description: "UTM medium parameter from URL"
    },
    {
      name: "utm_campaign",
      title: "UTM Campaign",
      type: "string",
      description: "UTM campaign parameter from URL"
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
