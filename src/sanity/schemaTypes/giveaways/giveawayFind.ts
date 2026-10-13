import { defineArrayMember, defineField, defineType } from "sanity";

const FLOW_OPTIONS = [
  { title: "CD keys", value: "cd_key" },
  { title: "Link-based CD keys", value: "link_based_cdkey" },
  { title: "PRO account", value: "account" },
  { title: "Links to get PRO account", value: "link_based_account" }
];

/**
 * Giveaway found on a third-party site by the `discover-giveaways` cron. Reviewed in /admin/giveaway-finds.
 * Ids are `giveawayFind.<hash>`: the dot keeps them (and their source URLs) out of the public dataset API.
 */
export const giveawayFind = defineType({
  name: "giveawayFind",
  title: "Giveaway Find",
  type: "document",
  fields: [
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "New", value: "new" },
          { title: "Reviewing", value: "reviewing" },
          { title: "Added", value: "added" },
          { title: "Dismissed", value: "dismissed" }
        ],
        layout: "radio"
      },
      initialValue: "new",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "dismissedReason",
      title: "Dismissed by scan",
      type: "string",
      description: 'Set when the scan dismissed the find itself, e.g. "expired" when the giveaway end date passed.',
      readOnly: true
    }),
    defineField({
      name: "sourceId",
      title: "Source key",
      type: "string",
      description: "Key of the source in Giveaway Discovery Settings.",
      readOnly: true
    }),
    defineField({ name: "sourceUrl", title: "Source URL", type: "url", readOnly: true }),
    defineField({ name: "sourceTitle", title: "Source title", type: "string", readOnly: true }),
    defineField({ name: "publishedAt", title: "Published at (source)", type: "datetime", readOnly: true }),
    defineField({
      name: "sourceModifiedAt",
      title: "Modified at (source)",
      type: "datetime",
      readOnly: true,
      hidden: true
    }),
    defineField({
      name: "program",
      title: "Program",
      type: "reference",
      to: [{ type: "program" }],
      description: "Matched program. Empty for possible matches until confirmed in the admin."
    }),
    defineField({
      name: "matchMethod",
      title: "Match method",
      type: "string",
      options: {
        list: [
          { title: "Watch URL", value: "watch_url" },
          { title: "Alias", value: "alias" },
          { title: "Title", value: "title" },
          { title: "Fuzzy", value: "fuzzy" },
          { title: "Manual", value: "manual" },
          { title: "Possible match", value: "possible" }
        ]
      },
      readOnly: true
    }),
    defineField({ name: "matchConfidence", title: "Match confidence", type: "number", readOnly: true }),
    defineField({
      name: "candidates",
      title: "Candidate programs",
      type: "array",
      readOnly: true,
      of: [
        defineArrayMember({
          type: "object",
          name: "giveawayFindCandidate",
          fields: [
            defineField({ name: "program", type: "reference", to: [{ type: "program" }] }),
            defineField({ name: "score", type: "number" })
          ],
          preview: {
            select: { title: "program.title", score: "score" },
            prepare: ({ title, score }) => ({
              title: title ?? "Program",
              subtitle: typeof score === "number" ? `score ${score.toFixed(2)}` : undefined
            })
          }
        })
      ]
    }),
    defineField({
      name: "detectedFlow",
      title: "Detected activation flow",
      type: "string",
      options: { list: FLOW_OPTIONS },
      readOnly: true
    }),
    defineField({
      name: "keys",
      title: "Keys",
      type: "array",
      readOnly: true,
      of: [
        defineArrayMember({
          type: "object",
          name: "giveawayFindKey",
          fields: [
            defineField({ name: "value", type: "string" }),
            defineField({ name: "isNew", type: "boolean" }),
            defineField({ name: "ignoredReason", type: "string" })
          ],
          preview: {
            select: { title: "value", isNew: "isNew", ignoredReason: "ignoredReason" },
            prepare: ({ title, isNew, ignoredReason }) => ({
              title,
              subtitle: ignoredReason ? `Ignored (${ignoredReason})` : isNew ? "New" : "Already on program"
            })
          }
        })
      ]
    }),
    defineField({
      name: "accounts",
      title: "Accounts",
      type: "array",
      readOnly: true,
      of: [
        defineArrayMember({
          type: "object",
          name: "giveawayFindAccount",
          fields: [
            defineField({ name: "username", type: "string" }),
            defineField({ name: "password", type: "string" }),
            defineField({ name: "isNew", type: "boolean" }),
            defineField({ name: "ignoredReason", type: "string" })
          ],
          preview: {
            select: { title: "username", isNew: "isNew", ignoredReason: "ignoredReason" },
            prepare: ({ title, isNew, ignoredReason }) => ({
              title,
              subtitle: ignoredReason ? `Ignored (${ignoredReason})` : isNew ? "New" : "Already on program"
            })
          }
        })
      ]
    }),
    defineField({
      name: "links",
      title: "Giveaway links",
      type: "array",
      readOnly: true,
      of: [
        defineArrayMember({
          type: "object",
          name: "giveawayFindLink",
          fields: [
            defineField({ name: "url", type: "url" }),
            defineField({ name: "label", type: "string" }),
            defineField({ name: "isNew", type: "boolean" }),
            defineField({ name: "ignoredReason", type: "string" })
          ],
          preview: {
            select: { title: "label", subtitle: "url" }
          }
        })
      ]
    }),
    defineField({ name: "version", title: "Version", type: "string", readOnly: true }),
    defineField({ name: "validUntil", title: "Valid until (best effort)", type: "datetime", readOnly: true }),
    defineField({ name: "excerpt", title: "Excerpt", type: "text", rows: 4, readOnly: true }),
    defineField({ name: "contentHash", title: "Content hash", type: "string", readOnly: true, hidden: true }),
    defineField({ name: "firstSeenAt", title: "First seen", type: "datetime", readOnly: true }),
    defineField({ name: "lastSeenAt", title: "Last seen", type: "datetime", readOnly: true }),
    defineField({ name: "lastChangedAt", title: "Last changed", type: "datetime", readOnly: true }),
    defineField({ name: "notes", title: "Notes", type: "text", rows: 3 })
  ],
  orderings: [
    {
      title: "Last changed",
      name: "lastChangedDesc",
      by: [{ field: "lastChangedAt", direction: "desc" }]
    }
  ],
  preview: {
    select: { title: "sourceTitle", program: "program.title", status: "status", sourceId: "sourceId" },
    prepare: ({ title, program, status, sourceId }) => ({
      title: title ?? "Giveaway find",
      subtitle: [status, program ?? "possible match", sourceId].filter(Boolean).join(" · ")
    })
  }
});
