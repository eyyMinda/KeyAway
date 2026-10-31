"use client";

import Link from "@/src/components/ui/HoverPrefetchLink";
import { useActivePromotion } from "@components/providers/PromotionProvider";
import { getPromotionTheme } from "@/src/lib/promotions/promotionThemes";
import { trackPromotionClick } from "@/src/lib/promotions/promotionUtils";

/** Small link pinned to the hero image; the hero copy itself stays untouched. */
export default function PromotionHeroBadge() {
  const promotion = useActivePromotion();
  if (!promotion?.heroText) return null;

  const theme = getPromotionTheme(promotion.theme);

  return (
    <Link
      href={promotion.ctaUrl}
      target="_blank"
      rel="noreferrer"
      onClick={() => trackPromotionClick("home", promotion._id)}
      className={`absolute bottom-3 left-3 z-10 max-w-[calc(100%-1.5rem)] rounded-sm border px-3 py-1.5 text-xs font-semibold shadow-lg transition-transform hover:scale-[1.02] ${theme.surface}`}>
      <span aria-hidden className="mr-1.5">
        {theme.emoji}
      </span>
      {promotion.heroText} →
    </Link>
  );
}
