import { defineField, defineType } from "sanity";

/**
 * Vendor-level "Giveaway key vs Official PRO license" row.
 *
 * A giveaway CD key unlocks the *real* PRO version temporarily, so this is NOT
 * "free tier vs paid features" — it honestly compares the two ways to run PRO:
 * a community giveaway key (temporary, version-locked, activation-capped) vs an
 * official license (permanent for its term, latest version, updates, support).
 *
 * Lives on the vendor (`vendor.giveawayVsOfficial`) and is shown on the vendor
 * hub, since the caveats are the same for every product from that vendor.
 */
export const giveawayComparisonRow = defineType({
  name: "giveawayComparisonRow",
  title: "Giveaway vs Official PRO row",
  type: "object",
  fields: [
    defineField({
      name: "feature",
      title: "Aspect",
      type: "string",
      description: 'What is being compared, e.g. "Auto-updates", "How long it lasts", "Activation slots".',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "giveaway",
      title: "Giveaway key",
      type: "string",
      description: 'The community giveaway route, e.g. "Temporary — expires after the promo".'
    }),
    defineField({
      name: "officialPro",
      title: "Official PRO license",
      type: "string",
      description: 'The paid official route, e.g. "Full license term with updates".'
    })
  ],
  preview: {
    select: { title: "feature", giveaway: "giveaway", officialPro: "officialPro" },
    prepare({ title, giveaway, officialPro }) {
      return {
        title: title || "Row",
        subtitle: [giveaway, officialPro].filter(Boolean).join("  →  ") || undefined
      };
    }
  }
});
