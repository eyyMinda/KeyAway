import { defineField, defineType } from "sanity";

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
      of: [{ type: "bundledTrackingEvent" }]
    })
  ]
});
