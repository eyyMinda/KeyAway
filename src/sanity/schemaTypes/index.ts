import { type SchemaTypeDefinition } from "sanity";

import { trackingEvent } from "./trackingEvent";
import { trackingEventBundle } from "./trackingEventBundle";
import { keyReport } from "./keyReport";
import { cronRun } from "./cronRun";
import contactMessage from "./contactMessage";
import keySuggestion from "./keySuggestion";

import { storeDetails } from "./storeDetails";
import { storeSocialEntry } from "./storeSocialEntry";
import { link } from "./link";

import { aboutPoint, aboutSection } from "./aboutSection";
import { faqItem, program } from "./program";
import { cdKey } from "./cdKey";
import { featuredProgramSettings } from "./featuredProgramSettings";
import { visitor } from "./visitor";
import { interactionEventBucket } from "./interactionEventBucket";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    trackingEvent,
    trackingEventBundle,
    keyReport,
    cronRun,
    contactMessage,
    keySuggestion,
    link,
    storeSocialEntry,
    storeDetails,
    aboutPoint,
    aboutSection,
    faqItem,
    program,
    cdKey,
    featuredProgramSettings,
    visitor,
    interactionEventBucket
  ]
};
