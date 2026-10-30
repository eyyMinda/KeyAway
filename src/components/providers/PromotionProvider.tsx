"use client";

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";
import { findActivePromotion, msUntilNextPromotionChange } from "@/src/lib/promotions/promotionUtils";
import type { SitePromotion } from "@/src/types/promotions";

const PromotionContext = createContext<SitePromotion | null>(null);

/** Filled from root `layout`. Hydrates on `renderedAt`, then follows the visitor's clock across start and end. */
export function PromotionProvider({
  promotions,
  renderedAt,
  children
}: {
  promotions: SitePromotion[];
  renderedAt: number;
  children: ReactNode;
}) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const schedule = () => {
        const delay = msUntilNextPromotionChange(promotions, Date.now());
        if (delay === null) return;
        timer = setTimeout(() => {
          onChange();
          schedule();
        }, delay);
      };
      schedule();
      return () => clearTimeout(timer);
    },
    [promotions]
  );

  const active = useSyncExternalStore(
    subscribe,
    () => findActivePromotion(promotions, Date.now()),
    () => findActivePromotion(promotions, renderedAt)
  );

  return <PromotionContext.Provider value={active}>{children}</PromotionContext.Provider>;
}

export function useActivePromotion(): SitePromotion | null {
  return useContext(PromotionContext);
}
