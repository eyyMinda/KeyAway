import { defineField, defineType } from "sanity";

import type { CDKeyStatus } from "@/src/types/program";

const STATUS_LIST: { title: string; value: CDKeyStatus }[] = [
  { title: "New", value: "new" },
  { title: "Active", value: "active" },
  { title: "Expired", value: "expired" },
  { title: "Limit Reached", value: "limit" }
];

export const cdKey = defineType({
  name: "cdKey",
  title: "CD Key",
  type: "object",
  fields: [
    defineField({
      name: "key",
      title: "Key",
      type: "string",
      validation: Rule => Rule.required().min(1)
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: { list: STATUS_LIST, layout: "radio" },
      initialValue: "new",
      validation: Rule =>
        Rule.required().custom((value: unknown) => {
          if (typeof value !== "string") return "Status is required";
          if (!STATUS_LIST.some(s => s.value === value)) return "Pick a valid status";
          return true;
        })
    }),
    defineField({
      name: "version",
      title: "Program Version",
      type: "string"
    }),
    defineField({
      name: "validFrom",
      title: "Valid From",
      type: "datetime"
    }),
    defineField({
      name: "validUntil",
      title: "Valid Until",
      type: "datetime",
      validation: Rule =>
        Rule.custom(value => {
          if (value && typeof value === "string" && isNaN(new Date(value).getTime())) {
            return "Invalid date format";
          }
          return true;
        })
    }),
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      description: "When this key was first added (auto-filled on creation)",
      initialValue: () => new Date().toISOString(),
      readOnly: ({ parent }) => !!parent?.createdAt
    })
  ],
  preview: {
    select: { key: "key", status: "status", version: "version" },
    prepare({ key, status, version }: { key?: string; status?: string; version?: string }) {
      return {
        title: key ? `${key.slice(0, 12)}${key.length > 12 ? "…" : ""}` : "CD key",
        subtitle: [status, version].filter(Boolean).join(" · ") || "No status"
      };
    }
  }
});
