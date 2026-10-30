import { defineField, defineType } from "sanity";
import { PROMOTION_THEMES, type PromotionThemeId } from "@/src/lib/promotions/promotionThemes";

const themeOptions = Object.entries(PROMOTION_THEMES).map(([value, theme]) => ({
  title: `${theme.emoji} ${theme.title}`,
  value
}));

function textField(name: string, title: string, description: string, fieldset: string) {
  return defineField({ name, title, type: "string", description, fieldset });
}

export const sitePromotion = defineType({
  name: "sitePromotion",
  title: "Promotions",
  type: "document",
  fieldsets: [
    { name: "schedule", title: "Schedule" },
    { name: "link", title: "Button" },
    { name: "banner", title: "Banner on every page" },
    { name: "program", title: "Card on program pages" },
    { name: "bell", title: "Notification bell" },
    { name: "home", title: "Homepage" }
  ],
  fields: [
    defineField({
      name: "title",
      title: "Name",
      type: "string",
      description: "Only shown in the Studio, e.g. Halloween giveaway 2026.",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "enabled",
      title: "Enabled",
      type: "boolean",
      description: "Turn off to hide this promotion immediately, whatever the dates say.",
      initialValue: true,
      fieldset: "schedule"
    }),
    defineField({
      name: "startsAt",
      title: "Starts",
      type: "datetime",
      description: "Shown in your local time. If two promotions overlap, the one that started first is shown.",
      fieldset: "schedule",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "endsAt",
      title: "Ends",
      type: "datetime",
      description: "Everything disappears at this moment, with no redeploy needed.",
      fieldset: "schedule",
      validation: Rule =>
        Rule.required().custom((value, context) => {
          const startsAt = (context.document as { startsAt?: string } | undefined)?.startsAt;
          if (!value || !startsAt) return true;
          return new Date(value).getTime() > new Date(startsAt).getTime() || "End must be after the start.";
        })
    }),
    defineField({
      name: "theme",
      title: "Theme",
      type: "string",
      options: { list: themeOptions },
      initialValue: "community" satisfies PromotionThemeId,
      fieldset: "schedule",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "ctaLabel",
      title: "Button label",
      type: "string",
      initialValue: "Join to enter",
      fieldset: "link",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "ctaUrl",
      title: "Button link",
      type: "url",
      description: "Leave blank to use the Facebook group from Store Details.",
      fieldset: "link",
      validation: Rule => Rule.uri({ scheme: ["http", "https"] })
    }),
    defineField({
      name: "mascot",
      title: "Mascot",
      type: "image",
      description: "Optional small image that floats by the button. Works best at about 48 × 73 px.",
      fieldset: "link"
    }),
    defineField({
      name: "bannerMascot",
      title: "Banner mascot",
      type: "image",
      description: "Optional different image for the banner. Leave blank to use Mascot there too.",
      fieldset: "link"
    }),
    textField("bannerText", "Banner text", "Leave blank to hide the banner.", "banner"),
    textField("cardTitle", "Title", "Used on every program page.", "program"),
    defineField({
      name: "cardText",
      title: "Text",
      type: "text",
      rows: 3,
      description: "Leave blank to keep the normal Facebook group card.",
      fieldset: "program"
    }),
    defineField({
      name: "programs",
      title: "Programs in this promotion",
      type: "array",
      of: [{ type: "reference", to: [{ type: "program" }] }],
      description: "Optional. These pages use the per-program title below.",
      fieldset: "program"
    }),
    textField(
      "cardProgramTitle",
      "Per-program title",
      "{program} becomes the program name, e.g. Win {program} Pro.",
      "program"
    ),
    textField("bellTitle", "Pinned row title", "Leave blank to skip the pinned row.", "bell"),
    textField("bellText", "Pinned row text", "Short line under the title.", "bell"),
    textField("popupText", "Popup text", "Replaces \"New updates available!\". Blank keeps the default.", "bell"),
    textField("heroText", "Badge on the hero image", "Keep it short. Leave blank to hide it.", "home")
  ],
  orderings: [{ title: "Newest first", name: "startsAtDesc", by: [{ field: "startsAt", direction: "desc" }] }],
  preview: {
    select: { title: "title", startsAt: "startsAt", endsAt: "endsAt", enabled: "enabled", theme: "theme" },
    prepare({
      title,
      startsAt,
      endsAt,
      enabled,
      theme
    }: {
      title?: string;
      startsAt?: string;
      endsAt?: string;
      enabled?: boolean;
      theme?: PromotionThemeId;
    }) {
      const day = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : "?");
      return {
        title: `${theme ? PROMOTION_THEMES[theme]?.emoji ?? "" : ""} ${title ?? "Untitled"}`.trim(),
        subtitle: `${enabled === false ? "Off · " : ""}${day(startsAt)} – ${day(endsAt)}`
      };
    }
  }
});
