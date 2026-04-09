import { defineType } from "sanity";

export const interactionEventBucket = defineType({
  name: "interactionEventBucket",
  title: "Interaction Event Bucket",
  type: "document",
  fields: [
    { name: "bucketKey", title: "Bucket Key", type: "string", validation: Rule => Rule.required() },
    { name: "bucketDateHour", title: "Bucket Date Hour", type: "string", validation: Rule => Rule.required() },
    { name: "pagePath", title: "Page Path", type: "string", validation: Rule => Rule.required() },
    { name: "sectionId", title: "Section Id", type: "string", validation: Rule => Rule.required() },
    { name: "interactionId", title: "Interaction Id", type: "string", validation: Rule => Rule.required() },
    { name: "programSlug", title: "Program Slug", type: "string" },
    { name: "count", title: "Count", type: "number", validation: Rule => Rule.required().min(0) },
    { name: "lastSeenAt", title: "Last Seen At", type: "datetime", validation: Rule => Rule.required() },
    { name: "createdAt", title: "Created At", type: "datetime", validation: Rule => Rule.required() }
  ],
  preview: {
    select: {
      title: "interactionId",
      subtitle: "sectionId",
      path: "pagePath",
      count: "count",
      hour: "bucketDateHour"
    },
    prepare(selection) {
      const { title, subtitle, path, count, hour } = selection as {
        title?: string;
        subtitle?: string;
        path?: string;
        count?: number;
        hour?: string;
      };
      return {
        title: title || "interaction",
        subtitle: `${subtitle || "section"} • ${path || "/"} • ${hour || ""} • ${count ?? 0}`
      };
    }
  }
});
