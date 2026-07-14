import { type SchemaTypeDefinition } from "sanity";

import { trackingEvent } from "./analytics/trackingEvent";
import { bundledTrackingEvent } from "./analytics/bundledTrackingEvent";
import { bundledVisitor } from "./analytics/bundledVisitor";
import { trackingEventBundle } from "./analytics/trackingEventBundle";
import { visitorBundle } from "./analytics/visitorBundle";
import { keyReport } from "./analytics/keyReport";
import { visitor } from "./analytics/visitor";

import { cronRun } from "./system/cronRun";
import { siteNotificationFeed } from "./system/siteNotificationFeed";
import contactMessage from "./contact/contactMessage";
import { contactMessageReply } from "./contact/contactMessageReply";
import keySuggestion from "./contact/keySuggestion";

import { storeDetails } from "./store/storeDetails";
import { storeOtherLink } from "./store/storeOtherLink";
import { storeSocialEntry } from "./store/storeSocialEntry";
import { link } from "./store/link";

import { aboutPoint, aboutSection } from "./program/aboutSection";
import { programComment, programCommentReply } from "./program/programComment";
import { faqItem, program } from "./program/program";
import { cdKey } from "./program/cdKey";
import { featuredProgramSettings } from "./program/featuredProgramSettings";
import { freeVsProRow } from "./program/freeVsProRow";

import { vendor } from "./vendor/vendor";
import { giveawayComparisonRow } from "./vendor/giveawayComparisonRow";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    trackingEvent,
    bundledTrackingEvent,
    bundledVisitor,
    trackingEventBundle,
    visitorBundle,
    keyReport,
    cronRun,
    siteNotificationFeed,
    contactMessage,
    contactMessageReply,
    keySuggestion,
    link,
    storeSocialEntry,
    storeOtherLink,
    storeDetails,
    aboutPoint,
    aboutSection,
    programComment,
    programCommentReply,
    faqItem,
    program,
    cdKey,
    featuredProgramSettings,
    freeVsProRow,
    giveawayComparisonRow,
    vendor,
    visitor
  ]
};
