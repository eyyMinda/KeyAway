import { defineArrayMember, defineField, defineType } from "sanity";

const sessionEventFields = [
  defineField({ name: "event", type: "string", validation: Rule => Rule.required() }),
  defineField({ name: "createdAt", type: "datetime", validation: Rule => Rule.required() }),
  defineField({ name: "path", type: "string" }),
  defineField({ name: "programSlug", type: "string" }),
  defineField({ name: "notFound", type: "boolean" }),
  defineField({ name: "key", type: "string" }),
  defineField({ name: "label", type: "string" }),
  defineField({ name: "social", type: "string" }),
  defineField({ name: "activationUrl", type: "string" }),
  defineField({ name: "programFlow", type: "string" }),
  defineField({ name: "listedVersion", type: "string" }),
  defineField({ name: "triedVersionFit", type: "string" }),
  defineField({ name: "triedVersion", type: "string" }),
  defineField({ name: "sourceId", type: "string", description: "Original document id when this row was copied. Live visits leave this empty." })
];

export const trackingSessionEvent = defineType({
  name: "trackingSessionEvent",
  title: "Tracking session event",
  type: "object",
  fields: sessionEventFields
});

const sessionFields = [
  defineField({ name: "visitorHash", type: "string", validation: Rule => Rule.required() }),
  defineField({ name: "startedAt", type: "datetime", validation: Rule => Rule.required() }),
  defineField({ name: "lastEventAt", type: "datetime", validation: Rule => Rule.required() }),
  defineField({
    name: "entry",
    type: "string",
    options: {
      list: [
        { title: "Direct", value: "direct" },
        { title: "External", value: "external" },
        { title: "Internal navigation", value: "internal" },
        { title: "Restored tab", value: "restore" }
      ]
    }
  }),
  defineField({ name: "referrer", type: "url" }),
  defineField({ name: "landingPath", type: "string" }),
  defineField({ name: "userAgent", type: "string" }),
  defineField({ name: "country", type: "string" }),
  defineField({ name: "city", type: "string" }),
  defineField({ name: "utm_source", type: "string" }),
  defineField({ name: "utm_medium", type: "string" }),
  defineField({ name: "utm_campaign", type: "string" }),
  defineField({ name: "eventCount", type: "number" }),
  defineField({ name: "reportCount", type: "number" }),
  defineField({
    name: "contributionCount",
    type: "number",
    description: "Key reports, comments, key suggestions, and contact messages in this visit."
  }),
  defineField({
    name: "events",
    type: "array",
    of: [defineArrayMember({ type: "trackingSessionEvent" })]
  })
];

/** One visit. Landing referrer is stored once. Clicks and key reports live in `events`. */
export const trackingSession = defineType({
  name: "trackingSession",
  title: "Tracking session",
  type: "document",
  fields: sessionFields,
  preview: {
    select: { entry: "entry", landingPath: "landingPath", eventCount: "eventCount", startedAt: "startedAt" },
    prepare({ entry, landingPath, eventCount, startedAt }) {
      return {
        title: landingPath || "Session",
        subtitle: [entry, `${eventCount ?? 0} events`, startedAt].filter(Boolean).join(" · ")
      };
    }
  }
});

export const bundledTrackingSession = defineType({
  name: "bundledTrackingSession",
  title: "Bundled tracking session",
  type: "object",
  fields: sessionFields
});

export const trackingSessionBundle = defineType({
  name: "trackingSessionBundle",
  title: "Tracking session bundle",
  type: "document",
  fields: [
    defineField({ name: "bundledAt", type: "datetime", readOnly: true }),
    defineField({ name: "updatedAt", type: "datetime", readOnly: true }),
    defineField({ name: "timeRangeStart", type: "datetime" }),
    defineField({ name: "timeRangeEnd", type: "datetime" }),
    defineField({ name: "sessionCount", type: "number" }),
    defineField({ name: "origin", type: "string", description: "migration bundles are not reused by the live session cron." }),
    defineField({ name: "capacity", type: "number", initialValue: 800, readOnly: true }),
    defineField({
      name: "sessions",
      type: "array",
      of: [defineArrayMember({ type: "bundledTrackingSession" })],
      validation: Rule => Rule.max(800)
    })
  ],
  preview: {
    select: { sessionCount: "sessionCount", timeRangeEnd: "timeRangeEnd" },
    prepare({ sessionCount, timeRangeEnd }) {
      return {
        title: `Session bundle (${sessionCount ?? 0})`,
        subtitle: timeRangeEnd ? String(timeRangeEnd) : ""
      };
    }
  }
});
