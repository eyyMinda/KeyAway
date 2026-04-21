import { cache } from "react";
import { client } from "@/src/sanity/lib/client";
import { storeDetailsQuery } from "@/src/lib/sanity/queries";
import { EMPTY_STORE_DETAILS } from "@/src/lib/site/storeDetailsEmpty";

export const getCachedStoreDetailsDocument = cache(async () => {
  const rows = await client.fetch(storeDetailsQuery, {}, { next: { tags: ["storeDetails"] } });
  return rows?.[0] ?? EMPTY_STORE_DETAILS;
});
