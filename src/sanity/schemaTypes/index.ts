import { type SchemaTypeDefinition } from "sanity";

import { program } from "./program";
import { cdKey } from "./cdKey";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [program, cdKey]
};
