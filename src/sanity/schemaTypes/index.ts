import { type SchemaTypeDefinition } from "sanity";

import { trackingEvent } from "./analytics/trackingEvent";
import { bundledTrackingEvent } from "./analytics/bundledTrackingEvent";
import { trackingEventBundle } from "./analytics/trackingEventBundle";
import { keyReport } from "./analytics/keyReport";
import { visitor } from "./analytics/visitor";

import { cronRun } from "./system/cronRun";
import { siteNotificationFeed } from "./system/siteNotificationFeed";
import contactMessage from "./contact/contactMessage";
import keySuggestion from "./contact/keySuggestion";

import { storeDetails } from "./store/storeDetails";
import { storeOtherLink } from "./store/storeOtherLink";
import { storeSocialEntry } from "./store/storeSocialEntry";
import { link } from "./store/link";

import { aboutPoint, aboutSection } from "./program/aboutSection";
import { faqItem, program } from "./program/program";
import { cdKey } from "./program/cdKey";
import { featuredProgramSettings } from "./program/featuredProgramSettings";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    trackingEvent,
    bundledTrackingEvent,
    trackingEventBundle,
    keyReport,
    cronRun,
    siteNotificationFeed,
    contactMessage,
    keySuggestion,
    link,
    storeSocialEntry,
    storeOtherLink,
    storeDetails,
    aboutPoint,
    aboutSection,
    faqItem,
    program,
    cdKey,
    featuredProgramSettings,
    visitor
  ]
};
