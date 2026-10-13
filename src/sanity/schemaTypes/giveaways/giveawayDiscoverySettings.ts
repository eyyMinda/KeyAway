import { defineArrayMember, defineField, defineType } from "sanity";

type SourceParent = { kind?: string } | undefined;
const kindOf = (parent: unknown) => (parent as SourceParent)?.kind;

/**
 * Private config for the daily giveaway scan: which sites to read and which pages to watch.
 * Edited as a singleton with id `GIVEAWAY_DISCOVERY_SETTINGS_ID` (see structure.ts), never listed publicly.
 */
export const giveawayDiscoverySettings = defineType({
  name: "giveawayDiscoverySettings",
  title: "Giveaway Discovery Settings",
  type: "document",
  fields: [
    defineField({
      name: "sources",
      title: "Sources",
      type: "array",
      description: "Sites listing new giveaways. Only posts matching an existing program are opened.",
      of: [
        defineArrayMember({
          type: "object",
          name: "giveawaySourceConfig",
          fields: [
            defineField({
              name: "key",
              title: "Key",
              type: "string",
              description: "Short stable id stored on finds (e.g. s1). Don't change it once finds exist.",
              validation: Rule => Rule.required().regex(/^[a-z0-9-]{1,32}$/, { name: "lowercase id" })
            }),
            defineField({ name: "label", title: "Label", type: "string", validation: Rule => Rule.required() }),
            defineField({ name: "enabled", title: "Enabled", type: "boolean", initialValue: true }),
            defineField({
              name: "kind",
              title: "Kind",
              type: "string",
              options: {
                list: [
                  { title: "RSS feed", value: "rss" },
                  { title: "WordPress REST API", value: "wp-rest" },
                  { title: "Watch pages only (host)", value: "watch-host" }
                ],
                layout: "radio"
              },
              validation: Rule => Rule.required()
            }),
            defineField({
              name: "url",
              title: "URL",
              type: "url",
              description: "RSS: the feed URL. WordPress REST: the site root. Watch pages only: the site root.",
              validation: Rule => Rule.required()
            }),
            defineField({
              name: "wpPostType",
              title: "WP post type",
              type: "string",
              description: 'REST base, e.g. "posts" or "product".',
              hidden: ({ parent }) => kindOf(parent) !== "wp-rest"
            }),
            defineField({
              name: "wpTaxonomy",
              title: "WP taxonomy",
              type: "string",
              description: 'e.g. "categories" or "product_cat".',
              hidden: ({ parent }) => kindOf(parent) !== "wp-rest"
            }),
            defineField({
              name: "wpTermIds",
              title: "WP term ids",
              type: "array",
              of: [{ type: "number" }],
              hidden: ({ parent }) => kindOf(parent) !== "wp-rest"
            }),
            defineField({
              name: "listingIncludesContent",
              title: "Listing includes post content",
              type: "boolean",
              description:
                "RSS content:encoded or WP content.rendered holds the giveaway details, so the post page is not opened.",
              initialValue: false,
              hidden: ({ parent }) => kindOf(parent) === "watch-host"
            }),
            defineField({
              name: "refetchOnModified",
              title: "Posts are updated in place",
              type: "boolean",
              description: "Re-open a known post when its modified date changes (WordPress REST only).",
              initialValue: false,
              hidden: ({ parent }) => kindOf(parent) !== "wp-rest"
            }),
            defineField({
              name: "contentSelector",
              title: "Content selector",
              type: "string",
              description: "CSS selector of the element holding the giveaway details. Empty = article/body."
            }),
            defineField({
              name: "titleFilter",
              title: "Title filter (regex)",
              type: "string",
              description: "Only listing items whose title matches are considered (case-insensitive).",
              validation: Rule =>
                Rule.custom(value => {
                  if (!value) return true;
                  try {
                    new RegExp(value, "i");
                    return true;
                  } catch {
                    return "Not a valid regular expression";
                  }
                })
            }),
            defineField({
              name: "linkOnly",
              title: "Keys are per person",
              type: "boolean",
              description: "Never extract keys from this site; always report the page link.",
              initialValue: false
            })
          ],
          preview: {
            select: { title: "label", kind: "kind", enabled: "enabled", key: "key" },
            prepare: ({ title, kind, enabled, key }) => ({
              title: title ?? key ?? "Source",
              subtitle: [key, kind, enabled === false ? "disabled" : null].filter(Boolean).join(" · ")
            })
          }
        })
      ],
      validation: Rule =>
        Rule.custom(items => {
          const keys = (items as { key?: string }[] | undefined)?.map(s => s.key).filter(Boolean) ?? [];
          return new Set(keys).size === keys.length ? true : "Source keys must be unique";
        })
    }),
    defineField({
      name: "watchPages",
      title: "Watch pages",
      type: "array",
      description: "Pages that always host one program's giveaway and are updated in place. Checked every day.",
      of: [
        defineArrayMember({
          type: "object",
          name: "giveawayWatchPage",
          fields: [
            defineField({
              name: "program",
              title: "Program",
              type: "reference",
              to: [{ type: "program" }],
              weak: true,
              validation: Rule => Rule.required()
            }),
            defineField({ name: "url", title: "URL", type: "url", validation: Rule => Rule.required() })
          ],
          preview: {
            select: { title: "program.title", subtitle: "url" }
          }
        })
      ]
    })
  ],
  preview: {
    prepare: () => ({ title: "Giveaway Discovery Settings" })
  }
});
