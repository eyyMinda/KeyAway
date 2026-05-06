import { defineField, defineType } from "sanity";

export const cronRun = defineType({
  name: "cronRun",
  title: "Cron Run",
  type: "document",
  readOnly: true,
  fields: [
    defineField({
      name: "job",
      title: "Job",
      type: "string",
      options: {
        list: [
          { title: "Bundle Events", value: "bundle-events" },
          { title: "Update Expired Keys", value: "update-expired-keys" },
          { title: "Prune Cron Runs", value: "prune-cron-runs" }
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "source",
      title: "Source",
      type: "string",
      description: "How the cron was triggered",
      options: {
        list: [
          { title: "Vercel Cron", value: "vercel_cron" },
          { title: "Bearer Token", value: "bearer" },
          { title: "Manual (POST)", value: "manual" }
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Success", value: "ok" },
          { title: "Error", value: "error" }
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "details",
      title: "Details",
      type: "string",
      description: "Optional result summary (e.g. bundled 5 events)"
    }),
    defineField({
      name: "ranAt",
      title: "Ran At",
      type: "datetime",
      validation: Rule => Rule.required()
    })
  ],
  preview: {
    select: { job: "job", source: "source", status: "status", ranAt: "ranAt" },
    prepare({ job, source, status, ranAt }: { job?: string; source?: string; status?: string; ranAt?: string }) {
      const d = ranAt ? new Date(ranAt).toLocaleString() : "";
      return {
        title: `${job} (${status})`,
        subtitle: `${source} · ${d}`
      };
    }
  }
});
