import { defineArrayMember, defineField, defineType } from "sanity";

const REASONS = [
  { title: "Activation limit reached", value: "limit" },
  { title: "Doesn't work", value: "invalid" },
  { title: "Giveaway expired", value: "expired" }
];

/**
 * Private list (fixed dotted id, see `GIVEAWAY_IGNORED_ITEMS_ID`) of keys/accounts/links found by the giveaway scan
 * that should never count as new again. Filled from /admin/giveaway-finds; remove a row here to un-ignore.
 */
export const giveawayIgnoredItems = defineType({
  name: "giveawayIgnoredItems",
  title: "Ignored Giveaway Keys",
  type: "document",
  fields: [
    defineField({
      name: "entries",
      title: "Ignored keys and accounts",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "giveawayIgnoredItem",
          fields: [
            defineField({
              name: "kind",
              title: "Kind",
              type: "string",
              options: {
                list: [
                  { title: "Key", value: "key" },
                  { title: "Account", value: "account" },
                  { title: "Giveaway link", value: "link" }
                ]
              },
              validation: Rule => Rule.required()
            }),
            defineField({
              name: "value",
              title: "Key / username / URL",
              type: "string",
              validation: Rule => Rule.required()
            }),
            defineField({
              name: "reason",
              title: "Reason",
              type: "string",
              options: { list: REASONS, layout: "radio" },
              validation: Rule => Rule.required()
            }),
            defineField({ name: "program", title: "Program", type: "reference", to: [{ type: "program" }], weak: true }),
            defineField({ name: "ignoredAt", title: "Ignored at", type: "datetime" })
          ],
          preview: {
            select: { title: "value", reason: "reason", program: "program.title" },
            prepare: ({ title, reason, program }) => ({
              title,
              subtitle: [REASONS.find(r => r.value === reason)?.title ?? reason, program].filter(Boolean).join(" · ")
            })
          }
        })
      ]
    })
  ],
  preview: {
    prepare: () => ({ title: "Ignored Giveaway Keys" })
  }
});
