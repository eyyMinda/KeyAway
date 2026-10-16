import { client } from "@/src/sanity/lib/client";

/**
 * Dataset API, not the CDN. For read-then-write jobs (stats rollup, giveaway discovery):
 * a CDN hit can return a document version that was already changed or deleted.
 */
export const mutationClient = client.withConfig({ useCdn: false });
