import { cache } from "react";
import { client } from "@/src/sanity/lib/client";
import { storeDetailsQuery } from "@/src/lib/sanity/queries";
import { DEFAULT_STORE_NAME } from "@/src/lib/seo/storeSeoResolve";
import type { StoreDetails } from "@/src/types/layout";

/**
 * Fallback when no `storeDetails` document exists.
 * Cast: real documents supply `logo` / `logoLight`; empty fallback matches previous layout behavior.
 */
export const emptyStoreDetailsFallback = {
  title: DEFAULT_STORE_NAME,
  description: "Free Giveaway CD Keys",
  header: { isLogo: false, headerLinks: [] },
  footer: { isLogo: false, footerLinks: [] },
  socialLinks: [] as StoreDetails["socialLinks"]
} as unknown as StoreDetails;

/**
 * One Sanity fetch per server request for `storeDetails` (dedupes layout, `generateMetadata`, and pages).
 * Uses a shared tag for on-demand revalidation if you wire webhooks later.
 */
export const getCachedStoreDetailsDocument = cache(async () => {
  const rows = await client.fetch(storeDetailsQuery, {}, { next: { tags: ["storeDetails"] } });
  return rows?.[0] ?? emptyStoreDetailsFallback;
});
