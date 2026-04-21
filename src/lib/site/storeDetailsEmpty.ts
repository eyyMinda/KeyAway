import type { PortableTextBlock } from "@portabletext/types";
import type { StoreDetails } from "@/src/types/layout";
import { DEFAULT_STORE_NAME } from "@/src/lib/seo/storeSeoResolve";

/** No Sanity client — safe to import from client components (context default / SSR gap). */
export const EMPTY_STORE_DETAILS = {
  title: DEFAULT_STORE_NAME,
  description: [] as PortableTextBlock[],
  header: { isLogo: false, headerLinks: [] },
  footer: { isLogo: false, footerLinks: [] },
  socialLinks: [] as StoreDetails["socialLinks"],
  otherLinks: [] as StoreDetails["otherLinks"]
} as unknown as StoreDetails;
