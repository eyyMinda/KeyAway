import { defineArrayMember, defineField, defineType } from "sanity";

/** Fields copied verbatim from a `keyReport` document when it is archived. */
const bundledKeyReportFields = [
  defineField({ name: "eventType", type: "string" }),
  defineField({ name: "programSlug", type: "string" }),
  defineField({ name: "key", type: "string", description: "Row storage key (matches keyReport `key`)." }),
  defineField({ name: "label", type: "string" }),
  defineField({ name: "path", type: "string" }),
  defineField({ name: "referrer", type: "url" }),
  defineField({ name: "userAgent", type: "string" }),
  defineField({ name: "country", type: "string" }),
  defineField({ name: "city", type: "string" }),
  defineField({ name: "utm_source", type: "string" }),
  defineField({ name: "utm_medium", type: "string" }),
  defineField({ name: "utm_campaign", type: "string" }),
  defineField({ name: "ipHash", type: "string" }),
  defineField({ name: "listedVersion", type: "string" }),
  defineField({ name: "triedVersionFit", type: "string" }),
  defineField({ name: "triedVersion", type: "string" }),
  defineField({ name: "createdAt", type: "datetime" }),
  defineField({ name: "sourceId", type: "string", description: "Original keyReport document id." })
];

/** Snapshot of a `keyReport` row embedded in `keyReportBundle.reports`. */
export const bundledKeyReport = defineType({
  name: "bundledKeyReport",
  title: "Bundled key report",
  type: "object",
  fields: bundledKeyReportFields
});

export const keyReportBundle = defineType({
  name: "keyReportBundle",
  title: "Key report bundle",
  type: "document",
  fields: [
    defineField({ name: "bundledAt", type: "datetime", readOnly: true }),
    defineField({ name: "updatedAt", type: "datetime", readOnly: true }),
    defineField({ name: "timeRangeStart", type: "datetime", description: "Oldest createdAt in this bundle" }),
    defineField({ name: "timeRangeEnd", type: "datetime", description: "Newest createdAt in this bundle" }),
    defineField({ name: "reportCount", type: "number" }),
    defineField({ name: "capacity", type: "number", initialValue: 1000, readOnly: true }),
    defineField({
      name: "reports",
      type: "array",
      of: [defineArrayMember({ type: "bundledKeyReport" })],
      validation: Rule => Rule.max(1000)
    })
  ],
  preview: {
    select: { reportCount: "reportCount", timeRangeEnd: "timeRangeEnd" },
    prepare({ reportCount, timeRangeEnd }: { reportCount?: number; timeRangeEnd?: string }) {
      return {
        title: `Key report bundle (${reportCount ?? 0})`,
        subtitle: timeRangeEnd ? String(timeRangeEnd) : ""
      };
    }
  }
});
