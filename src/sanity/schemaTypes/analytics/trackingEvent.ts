import { defineField, defineType } from "sanity";
import {
  analyticsEventPreviewSubtitle,
  analyticsEventPreviewTitle
} from "@/src/sanity/lib/analyticsEventPreviewLabels";

export const trackingEvent = defineType({
  name: "trackingEvent",
  title: "Analytics Event",
  type: "document",
  preview: {
    select: {
      event: "event",
      path: "path",
      programSlug: "programSlug",
      country: "country",
      city: "city",
      ipHash: "ipHash"
    },
    prepare({ event, path, programSlug, country, city, ipHash }) {
      return {
        title: analyticsEventPreviewTitle(event, path, programSlug),
        subtitle: analyticsEventPreviewSubtitle(country, city, ipHash),
        media: false
      };
    }
  },
  fields: [
    defineField({
      name: "event",
      title: "Event Name",
      type: "string",
      options: {
        list: [
          { title: "Copy CD Key", value: "copy_cdkey" },
          { title: "Copy PRO Account", value: "copy_pro_account" },
          { title: "Click Activation Link", value: "click_activation_link" },
          { title: "Download Click", value: "download_click" },
          { title: "Social Click", value: "social_click" },
          { title: "Page Viewed", value: "page_viewed" }
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: "notFound",
      title: "Not found page view",
      type: "boolean",
      description: "True for 404 / invalid program URL on a page_viewed event (no program slug stored)."
    }),
    defineField({ name: "programSlug", title: "Program Slug", type: "string" }),
    defineField({
      name: "programFlow",
      title: "Program flow",
      type: "string",
      description: "When set, activation row interpretation (cd_key, account, link-based, etc.)."
    }),
    defineField({
      name: "key",
      title: "Key / row id",
      type: "string",
      description:
        "Copy events: normalized key or account string. Link-click / row-scoped events: storage row id or per-URL digest when applicable."
    }),
    defineField({
      name: "activationUrl",
      title: "Activation URL",
      type: "string",
      description: "For click_activation_link: which URL was opened."
    }),
    defineField({ name: "social", title: "Social Name", type: "string" }),
    defineField({ name: "path", title: "Path", type: "string" }),
    defineField({ name: "referrer", title: "Referrer", type: "url" }),
    defineField({ name: "userAgent", title: "User Agent", type: "string" }),
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
  ]
});
