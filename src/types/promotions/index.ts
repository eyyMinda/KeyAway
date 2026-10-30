import type { PromotionThemeId } from "@/src/lib/promotions/promotionThemes";

/** Where a promotion link was clicked; tracked as `social_click` with `social: promo-<placement>`. */
export type PromotionPlacement = "banner" | "program" | "bell" | "home";

/** Published `sitePromotion` with its CTA resolved. Blank copy fields hide that placement. */
export interface SitePromotion {
  _id: string;
  startsAt: string;
  endsAt: string;
  theme?: PromotionThemeId;
  ctaLabel: string;
  ctaUrl: string;
  mascotUrl?: string;
  bannerMascotUrl?: string;
  bannerText?: string;
  cardTitle?: string;
  cardText?: string;
  cardProgramTitle?: string;
  programSlugs?: string[];
  bellTitle?: string;
  bellText?: string;
  popupText?: string;
  heroText?: string;
}
