"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { StoreDetails } from "@/src/types/layout";
import { EMPTY_STORE_DETAILS } from "@/src/lib/site/storeDetailsEmpty";

const StoreDetailsContext = createContext<StoreDetails>(EMPTY_STORE_DETAILS);

/** Filled from root `layout` (Sanity `storeDetails`). Client layout pieces and `app/error` read via `useStoreDetails`. */
export function StoreDetailsProvider({ value, children }: { value: StoreDetails; children: ReactNode }) {
  return <StoreDetailsContext.Provider value={value}>{children}</StoreDetailsContext.Provider>;
}

export function useStoreDetails(): StoreDetails {
  return useContext(StoreDetailsContext);
}
