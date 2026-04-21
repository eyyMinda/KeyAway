import { defineField, defineType } from "sanity";

import { formatValidUntilDisplay } from "@/src/lib/program/cdKeyUtils";
import { validateCdKeyStatusValue, validateOptionalValidUntilDatetime } from "@/src/sanity/validators/program";
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
      validation: Rule => Rule.required().custom(value => validateCdKeyStatusValue(value))
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
      description: "Leave empty for a lifetime key (no fixed expiry).",
      validation: Rule => Rule.custom(value => validateOptionalValidUntilDatetime(value))
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
    select: {
      key: "key",
      status: "status",
      version: "version",
      validUntil: "validUntil",
      createdAt: "createdAt"
    },
    prepare(selection) {
      const { key, status, version, validUntil, createdAt } = selection;
      const k = typeof key === "string" ? key : "";
      const expiry = formatValidUntilDisplay(typeof validUntil === "string" ? validUntil : undefined);
      const created =
        createdAt != null && typeof createdAt === "string" && createdAt.trim()
          ? `created ${createdAt.trim().split("T")[0]}`
          : null;
      return {
        title: k ? `${k.slice(0, 12)}${k.length > 12 ? "…" : ""}` : "CD key",
        subtitle: [status, version, `until ${expiry}`, created].filter(Boolean).join(" · ") || "No status"
      };
    }
  }
});
