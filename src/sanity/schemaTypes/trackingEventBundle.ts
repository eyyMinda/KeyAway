import { defineField, defineType } from "sanity";

// All fields optional - track API only includes fields that have values. event + createdAt always present in source.
const bundledEventFields = [
  defineField({ name: "event", title: "Event Name", type: "string" }),
  defineField({ name: "createdAt", title: "Created At", type: "datetime" }),
  defineField({ name: "programSlug", title: "Program Slug", type: "string" }),
  defineField({ name: "path", title: "Path", type: "string" }),
  defineField({ name: "referrer", title: "Referrer", type: "string" }),
  defineField({ name: "country", title: "Country", type: "string" }),
  defineField({ name: "city", title: "City", type: "string" }),
  defineField({ name: "social", title: "Social Name", type: "string" }),
  defineField({ name: "keyHash", title: "Key Hash", type: "string" }),
  defineField({ name: "keyIdentifier", title: "Key Identifier", type: "string" }),
  defineField({ name: "keyNormalized", title: "Key Normalized", type: "string" }),
  defineField({ name: "userAgent", title: "User Agent", type: "string" }),
  defineField({ name: "ipHash", title: "Visitor Hash", type: "string" }),
  defineField({ name: "utm_source", title: "UTM Source", type: "string" }),
  defineField({ name: "utm_medium", title: "UTM Medium", type: "string" }),
  defineField({ name: "utm_campaign", title: "UTM Campaign", type: "string" })
];

export const trackingEventBundle = defineType({
  name: "trackingEventBundle",
  title: "Analytics Event Bundle",
  type: "document",
  fields: [
    defineField({
      name: "updatedAt",
      title: "Updated At",
      type: "datetime",
      description: "Last time cron added events to this bundle",
      readOnly: true
    }),
    defineField({
      name: "bundledAt",
      title: "Bundled At",
      type: "datetime",
      readOnly: true
    }),
    defineField({
      name: "timeRangeStart",
      title: "Time Range Start",
      type: "datetime",
      description: "Oldest event in this bundle"
    }),
    defineField({
      name: "timeRangeEnd",
      title: "Time Range End",
      type: "datetime",
      description: "Newest event in this bundle"
    }),
    defineField({
      name: "eventCount",
      title: "Event Count",
      type: "number",
      description: "Number of events in this bundle"
    }),
    defineField({
      name: "events",
      title: "Events",
      type: "array",
      of: [{ type: "object", fields: bundledEventFields }]
    })
  ]
});
