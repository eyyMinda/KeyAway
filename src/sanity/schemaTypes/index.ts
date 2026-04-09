import { type SchemaTypeDefinition } from "sanity";

import { trackingEvent } from "./trackingEvent";
import { trackingEventBundle } from "./trackingEventBundle";
import { keyReport } from "./keyReport";
import { cronRun } from "./cronRun";
import contactMessage from "./contactMessage";
import keySuggestion from "./keySuggestion";

import { storeDetails } from "./storeDetails";
import { header } from "./header";
import { footer } from "./footer";
import { link } from "./link";
import { socialLink } from "./socialLink";

import { program } from "./program";
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
    storeDetails,
    header,
    footer,
    socialLink,
    program,
    cdKey,
    featuredProgramSettings,
    visitor,
    interactionEventBucket
  ]
};
