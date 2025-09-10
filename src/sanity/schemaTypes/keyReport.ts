import { defineType } from "sanity";

export const keyReport = defineType({
  name: "keyReport",
  title: "Key Report",
  type: "document",
  fields: [
    {
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
    },
    {
      name: "programSlug",
      title: "Program Slug",
      type: "string",
      validation: Rule => Rule.required()
    },
    {
      name: "keyHash",
      title: "Key Hash",
      type: "string",
      description: "SHA-256 hash of the CD key for privacy",
      validation: Rule => Rule.required()
    },
    {
      name: "keyIdentifier",
      title: "Key Identifier",
      type: "string",
      description: "Short identifier like ABC***XYZ",
      validation: Rule => Rule.required()
    },
    {
      name: "keyNormalized",
      title: "Key Normalized",
      type: "string",
      description: "Normalized key for matching",
      validation: Rule => Rule.required()
    },
    {
      name: "path",
      title: "Path",
      type: "string",
      description: "Page where the report was submitted"
    },
    {
      name: "referrer",
      title: "Referrer",
      type: "url",
      description: "Page that referred the user"
    },
    {
      name: "userAgent",
      title: "User Agent",
      type: "string",
      description: "Browser information"
    },
    {
      name: "country",
      title: "Country",
      type: "string",
      description: "User's country based on IP geolocation"
    },
    {
      name: "city",
      title: "City",
      type: "string",
      description: "User's city based on IP geolocation"
    },
    {
      name: "utm_source",
      title: "UTM Source",
      type: "string",
      description: "UTM source parameter from URL"
    },
    {
      name: "utm_medium",
      title: "UTM Medium",
      type: "string",
      description: "UTM medium parameter from URL"
    },
    {
      name: "utm_campaign",
      title: "UTM Campaign",
      type: "string",
      description: "UTM campaign parameter from URL"
    },
    {
      name: "ipHash",
      title: "Visitor Hash",
      type: "string",
      description: "Hashed IP + salt. Used for deduping without storing raw IP."
    },
    {
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString()
    }
  ],
  preview: {
    select: {
      title: "eventType",
      subtitle: "programSlug",
      media: "eventType"
    },
    prepare(selection) {
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
