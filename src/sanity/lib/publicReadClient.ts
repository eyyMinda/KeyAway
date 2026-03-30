import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";

/**
 * Browser GROQ reads without the Sanity CDN so aggregates (e.g. key report counts) update
 * immediately after API writes. Same public dataset as the default client; no token.
 */
export const sanityPublicReadClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false
});
