import { type SchemaTypeDefinition } from "sanity";


import { cronRun } from "./system/cronRun";
import { changelogRelease } from "./system/changelogRelease";
import { siteNotificationBundle } from "./system/siteNotificationBundle";
import { siteNotificationFeed } from "./system/siteNotificationFeed";
import contactMessage from "./contact/contactMessage";
import { contactMessageReply } from "./contact/contactMessageReply";
import keySuggestion from "./contact/keySuggestion";
import { giveawayFind } from "./giveaways/giveawayFind";
import { giveawayDiscoverySettings } from "./giveaways/giveawayDiscoverySettings";
import { giveawayIgnoredItems } from "./giveaways/giveawayIgnoredItems";

import { storeDetails } from "./store/storeDetails";
import { storeOtherLink } from "./store/storeOtherLink";
import { storeSocialEntry } from "./store/storeSocialEntry";
import { link } from "./store/link";

import { aboutPoint, aboutSection } from "./program/aboutSection";
import { programComment, programCommentReaction, programCommentReply } from "./program/programComment";
import { faqItem, program } from "./program/program";
import { programCategory } from "./program/programCategory";
import { cdKey } from "./program/cdKey";
import { featuredProgramSettings } from "./program/featuredProgramSettings";
import { freeVsProRow } from "./program/freeVsProRow";

import { vendor } from "./vendor/vendor";
import { giveawayComparisonRow } from "./vendor/giveawayComparisonRow";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    cronRun,
    changelogRelease,
    siteNotificationFeed,
    siteNotificationBundle,
    contactMessage,
    contactMessageReply,
    keySuggestion,
    giveawayFind,
    giveawayDiscoverySettings,
    giveawayIgnoredItems,
    link,
    storeSocialEntry,
    storeOtherLink,
    storeDetails,
    aboutPoint,
    aboutSection,
    programComment,
    programCommentReply,
    programCommentReaction,
    faqItem,
    programCategory,
    program,
    cdKey,
    featuredProgramSettings,
    freeVsProRow,
    giveawayComparisonRow,
    vendor
  ]
};
