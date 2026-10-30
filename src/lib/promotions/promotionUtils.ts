import { trackEvent } from "@/src/lib/analytics/trackEvent";
import type { PromotionPlacement, SitePromotion } from "@/src/types/promotions";

/** Longest delay `setTimeout` can hold before it fires immediately. */
const MAX_TIMEOUT_MS = 2_147_483_647;

/** Earliest-starting promotion live at `nowMs`; `promotions` are sorted by `startsAt`. */
export function findActivePromotion(promotions: SitePromotion[], nowMs: number): SitePromotion | null {
  return (
    promotions.find(p => new Date(p.startsAt).getTime() <= nowMs && nowMs < new Date(p.endsAt).getTime()) ?? null
  );
}

/** Delay until the next start or end, so open tabs change without a reload. Null when nothing is left. */
export function msUntilNextPromotionChange(promotions: SitePromotion[], nowMs: number): number | null {
  const upcoming = promotions
    .flatMap(p => [new Date(p.startsAt).getTime(), new Date(p.endsAt).getTime()])
    .filter(ts => ts > nowMs);
  return upcoming.length ? Math.min(Math.min(...upcoming) - nowMs, MAX_TIMEOUT_MS) : null;
}

/** Program card heading: the per-program line on picked programs, otherwise the general title. */
export function resolvePromotionCardTitle(promotion: SitePromotion, programSlug: string, programTitle: string) {
  if (promotion.cardProgramTitle && promotion.programSlugs?.includes(programSlug)) {
    return promotion.cardProgramTitle.replaceAll("{program}", programTitle);
  }
  return promotion.cardTitle;
}

export function trackPromotionClick(placement: PromotionPlacement) {
  void trackEvent("social_click", { social: `promo-${placement}`, path: window.location.pathname });
}
