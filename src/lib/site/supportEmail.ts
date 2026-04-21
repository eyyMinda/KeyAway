import type { StoreDetails } from "@/src/types/layout";

/** Fallback when Sanity `storeDetails.supportEmail` is unset or invalid. */
export const DEFAULT_SUPPORT_EMAIL = "support@keyaway.app";

export function resolveSupportEmail(store: Pick<StoreDetails, "supportEmail"> | null | undefined): string {
  const v = store?.supportEmail?.trim();
  if (v && v.includes("@")) return v;
  return DEFAULT_SUPPORT_EMAIL;
}
