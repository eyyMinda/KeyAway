import { type SchemaTypeDefinition } from "sanity";

import { storeDetails } from "./storeDetails";
import { header } from "./header";
import { footer } from "./footer";
import { link } from "./link";

import { program } from "./program";
import { cdKey } from "./cdKey";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [link, storeDetails, header, footer, program, cdKey]
};
