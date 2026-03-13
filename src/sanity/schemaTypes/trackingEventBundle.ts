import { defineType } from "sanity";

// All fields optional - track API only includes fields that have values. event + createdAt always present in source.
const bundledEventFields = [
  { name: "event", title: "Event Name", type: "string" },
  { name: "createdAt", title: "Created At", type: "datetime" },
  { name: "programSlug", title: "Program Slug", type: "string" },
  { name: "path", title: "Path", type: "string" },
  { name: "referrer", title: "Referrer", type: "string" },
  { name: "country", title: "Country", type: "string" },
  { name: "city", title: "City", type: "string" },
  { name: "social", title: "Social Name", type: "string" },
  { name: "keyHash", title: "Key Hash", type: "string" },
  { name: "keyIdentifier", title: "Key Identifier", type: "string" },
  { name: "keyNormalized", title: "Key Normalized", type: "string" },
  { name: "userAgent", title: "User Agent", type: "string" },
  { name: "ipHash", title: "Visitor Hash", type: "string" },
  { name: "utm_source", title: "UTM Source", type: "string" },
  { name: "utm_medium", title: "UTM Medium", type: "string" },
  { name: "utm_campaign", title: "UTM Campaign", type: "string" }
];

export const trackingEventBundle = defineType({
  name: "trackingEventBundle",
  title: "Analytics Event Bundle",
  type: "document",
  fields: [
    {
      name: "bundledAt",
      title: "Bundled At",
      type: "datetime",
      readOnly: true
    },
    {
      name: "timeRangeStart",
      title: "Time Range Start",
      type: "datetime",
      description: "Oldest event in this bundle"
    },
    {
      name: "timeRangeEnd",
      title: "Time Range End",
      type: "datetime",
      description: "Newest event in this bundle"
    },
    {
      name: "eventCount",
      title: "Event Count",
      type: "number",
      description: "Number of events in this bundle"
    },
    {
      name: "events",
      title: "Events",
      type: "array",
      of: [{ type: "object", fields: bundledEventFields }]
    }
  ]
});
