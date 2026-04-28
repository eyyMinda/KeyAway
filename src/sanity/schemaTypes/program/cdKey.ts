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
  title: "Activation entry",
  type: "object",
  fields: [
    defineField({
      name: "key",
      title: "CD key",
      type: "string",
      hidden: ({ document }) => {
        const f = document?.programFlow ?? "cd_key";
        return f === "account" || f === "link_based_account";
      },
      validation: Rule =>
        Rule.custom((value, context) => {
          const flow = (context.document as { programFlow?: string } | undefined)?.programFlow ?? "cd_key";
          if (flow === "cd_key" || flow === "link_based_cdkey") {
            if (typeof value !== "string" || !value.trim()) return "Key is required for this flow";
          }
          return true;
        })
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
      description: "When this entry was first added (auto-filled on creation)",
      initialValue: () => new Date().toISOString(),
      readOnly: ({ parent }) => !!parent?.createdAt
    }),
    defineField({
      name: "accountLabel",
      title: "Label (optional)",
      type: "string",
      description: "Short name shown in lists (e.g. “Partner batch A”).",
      hidden: ({ document }) => (document?.programFlow ?? "cd_key") !== "account"
    }),
    defineField({
      name: "username",
      title: "Username / email",
      type: "string",
      hidden: ({ document }) => (document?.programFlow ?? "cd_key") !== "account",
      validation: Rule =>
        Rule.custom((value, context) => {
          const flow = (context.document as { programFlow?: string } | undefined)?.programFlow ?? "cd_key";
          if (flow === "account" && (typeof value !== "string" || !value.trim())) {
            return "Username is required for account flow";
          }
          return true;
        })
    }),
    defineField({
      name: "password",
      title: "Password",
      type: "string",
      hidden: ({ document }) => (document?.programFlow ?? "cd_key") !== "account",
      validation: Rule =>
        Rule.custom((value, context) => {
          const flow = (context.document as { programFlow?: string } | undefined)?.programFlow ?? "cd_key";
          if (flow === "account" && (typeof value !== "string" || !value.trim())) {
            return "Password is required for account flow";
          }
          return true;
        })
    }),
    defineField({
      name: "giveawayLinks",
      title: "Giveaway / partner links",
      type: "array",
      hidden: ({ document }) => (document?.programFlow ?? "cd_key") !== "link_based_account",
      of: [
        {
          type: "object",
          name: "giveawayLink",
          fields: [
            defineField({ name: "title", title: "Title", type: "string", validation: Rule => Rule.required() }),
            defineField({ name: "url", title: "URL", type: "url", validation: Rule => Rule.required() }),
            defineField({ name: "note", title: "Note", type: "string" })
          ],
          preview: {
            select: { title: "title", url: "url" },
            prepare({ title, url }: { title?: string; url?: string }) {
              const t = typeof title === "string" ? title : "";
              const u = typeof url === "string" ? url : "";
              return { title: t || "Link", subtitle: u };
            }
          }
        }
      ]
    })
  ],
  preview: {
    select: {
      key: "key",
      status: "status",
      version: "version",
      validUntil: "validUntil",
      createdAt: "createdAt",
      username: "username",
      accountLabel: "accountLabel",
      giveawayLinks: "giveawayLinks"
    },
    prepare(selection) {
      const { key, status, version, validUntil, createdAt, username, accountLabel, giveawayLinks } = selection;
      const k = typeof key === "string" ? key : "";
      const u = typeof username === "string" ? username : "";
      const label = typeof accountLabel === "string" ? accountLabel : "";
      const links = Array.isArray(giveawayLinks) ? giveawayLinks : [];
      const expiry = formatValidUntilDisplay(typeof validUntil === "string" ? validUntil : undefined);
      const created =
        createdAt != null && typeof createdAt === "string" && createdAt.trim()
          ? `created ${createdAt.trim().split("T")[0]}`
          : null;

      let title = "Entry";
      if (k.trim()) title = `${k.slice(0, 12)}${k.length > 12 ? "…" : ""}`;
      else if (label.trim() || u.trim()) title = (label.trim() || u).slice(0, 24);
      else if (links.length) title = `${links.length} link${links.length === 1 ? "" : "s"}`;

      return {
        title,
        subtitle: [status, version, `until ${expiry}`, created].filter(Boolean).join(" · ") || "No status"
      };
    }
  }
});
