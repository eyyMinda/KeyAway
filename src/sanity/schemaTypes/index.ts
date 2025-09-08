import { type SchemaTypeDefinition } from "sanity";

import { trackingEvent } from "./trackingEvent";

import { storeDetails } from "./storeDetails";
import { header } from "./header";
import { footer } from "./footer";
import { link } from "./link";
import { socialLink } from "./socialLink";

import { program } from "./program";
import { cdKey } from "./cdKey";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [trackingEvent, link, storeDetails, header, footer, socialLink, program, cdKey]
};
