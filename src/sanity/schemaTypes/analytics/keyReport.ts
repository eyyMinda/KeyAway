import { defineField, defineType } from "sanity";

export const keyReport = defineType({
  name: "keyReport",
  title: "Key Report",
  type: "document",
  fields: [
    defineField({
      name: "eventType",
      title: "Report Type",
      type: "string",
      options: {
        list: [
          { title: "Key Working", value: "report_key_working" },
          { title: "Key Expired", value: "report_key_expired" },
          { title: "Key Limit Reached", value: "report_key_limit_reached" }
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "programSlug",
      title: "Program Slug",
      type: "string",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "key",
      title: "Row storage key",
      type: "string",
      description:
        "Activation row id used on the program page: plain normalized CD key or account username, or short hash for link-based rows.",
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      description: "Optional display label (e.g. link titles, account label)."
    }),
    defineField({
      name: "path",
      title: "Path",
      type: "string",
      description: "Page where the report was submitted"
    }),
    defineField({
      name: "referrer",
      title: "Referrer",
      type: "url",
      description: "Page that referred the user"
    }),
    defineField({
      name: "userAgent",
      title: "User Agent",
      type: "string",
      description: "Browser information"
    }),
    defineField({
      name: "country",
      title: "Country",
      type: "string",
      description: "User's country based on IP geolocation"
    }),
    defineField({
      name: "city",
      title: "City",
      type: "string",
      description: "User's city based on IP geolocation"
    }),
    defineField({
      name: "utm_source",
      title: "UTM Source",
      type: "string",
      description: "UTM source parameter from URL"
    }),
    defineField({
      name: "utm_medium",
      title: "UTM Medium",
      type: "string",
      description: "UTM medium parameter from URL"
    }),
    defineField({
      name: "utm_campaign",
      title: "UTM Campaign",
      type: "string",
      description: "UTM campaign parameter from URL"
    }),
    defineField({
      name: "ipHash",
      title: "Visitor Hash",
      type: "string",
      description: "Hashed IP + salt. Used for deduping without storing raw IP."
    }),
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString()
    })
  ],
  preview: {
    select: {
      title: "eventType",
      subtitle: "programSlug",
      media: "eventType"
    },
    prepare(selection: { title?: string; subtitle?: string }) {
      const { title, subtitle } = selection;
      const eventLabels = {
        report_key_working: "✅ Working",
        report_key_expired: "❌ Expired",
        report_key_limit_reached: "⚠️ Limit Reached"
      };

      return {
        title: eventLabels[title as keyof typeof eventLabels] || title,
        subtitle: `Program: ${subtitle}`
      };
    }
  }
});
