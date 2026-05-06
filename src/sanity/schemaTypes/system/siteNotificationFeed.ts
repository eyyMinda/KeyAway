import { defineField, defineType } from "sanity";

const feedItemFields = [
  defineField({ name: "id", type: "string", validation: Rule => Rule.required() }),
  defineField({
    name: "type",
    type: "string",
    options: {
      list: [
        { title: "New program", value: "new_program" },
        { title: "New program + keys", value: "new_program_with_keys" },
        { title: "New keys", value: "new_keys" }
      ],
      layout: "radio"
    },
    validation: Rule => Rule.required()
  }),
  defineField({ name: "programSlug", type: "string", validation: Rule => Rule.required() }),
  defineField({ name: "programTitle", type: "string", validation: Rule => Rule.required() }),
  defineField({ name: "message", type: "string" }),
  defineField({ name: "createdAt", type: "string", validation: Rule => Rule.required() }),
  defineField({ name: "imageUrl", type: "string" })
];

/** Single document (`_id` fixed in app). Populated by `rebuildSiteNotificationFeed()` — see README / `notificationFeed.server.ts`. */
export const siteNotificationFeed = defineType({
  name: "siteNotificationFeed",
  title: "Site notification feed",
  type: "document",
  fields: [
    defineField({
      name: "items",
      title: "Notifications",
      type: "array",
      description: "Do not hand-edit for production: webhook/admin rebuild. Capped in code (see MAX_ITEMS).",
      validation: Rule => Rule.max(50),
      of: [{ type: "object", fields: feedItemFields }]
    })
  ]
});
