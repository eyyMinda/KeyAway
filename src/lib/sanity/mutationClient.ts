import { client } from "@/src/sanity/lib/client";

/**
 * Dataset API, not the CDN. Bundlers and rollups read a document and then delete it
 * in the next loop pass — a CDN hit still returns the deleted doc and the pass copies it again.
 */
export const mutationClient = client.withConfig({ useCdn: false });
