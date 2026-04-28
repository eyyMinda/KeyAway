import { defineField, defineType } from "sanity";
import {
  analyticsEventPreviewSubtitle,
  analyticsEventPreviewTitle
} from "@/src/sanity/lib/analyticsEventPreviewLabels";

/** Same shape as rows embedded in `trackingEventBundle.events` — track API only sends fields that exist. */
const bundledEventFields = [
  defineField({ name: "event", title: "Event Name", type: "string" }),
  defineField({
    name: "notFound",
    title: "Not found page view",
    type: "boolean",
    description: "True for 404 / invalid program URL on a page_viewed event (no program slug stored)."
  }),
  defineField({ name: "createdAt", title: "Created At", type: "datetime" }),
  defineField({ name: "programSlug", title: "Program Slug", type: "string" }),
  defineField({ name: "programFlow", title: "Program flow", type: "string" }),
  defineField({ name: "path", title: "Path", type: "string" }),
  defineField({ name: "referrer", title: "Referrer", type: "string" }),
  defineField({ name: "country", title: "Country", type: "string" }),
  defineField({ name: "city", title: "City", type: "string" }),
  defineField({ name: "social", title: "Social Name", type: "string" }),
  defineField({ name: "key", title: "Key / row id", type: "string" }),
  defineField({ name: "activationUrl", title: "Activation URL", type: "string" }),
  defineField({ name: "userAgent", title: "User Agent", type: "string" }),
  defineField({ name: "ipHash", title: "Visitor Hash", type: "string" }),
  defineField({ name: "utm_source", title: "UTM Source", type: "string" }),
  defineField({ name: "utm_medium", title: "UTM Medium", type: "string" }),
  defineField({ name: "utm_campaign", title: "UTM Campaign", type: "string" })
];

export const bundledTrackingEvent = defineType({
  name: "bundledTrackingEvent",
  title: "Bundled event",
  type: "object",
  fields: bundledEventFields,
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
  }
});
