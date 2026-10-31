"use client";

import Link from "@/src/components/ui/HoverPrefetchLink";
import { getPromotionTheme } from "@/src/lib/promotions/promotionThemes";
import { trackPromotionClick } from "@/src/lib/promotions/promotionUtils";
import type { SitePromotion } from "@/src/types/promotions";

interface PinnedPromotionItemProps {
  promotion: SitePromotion;
  onClose: () => void;
}

/** Campaign row above the scrolling feed, styled to match `NotificationItem`. */
export default function PinnedPromotionItem({ promotion, onClose }: PinnedPromotionItemProps) {
  const theme = getPromotionTheme(promotion.theme);

  return (
    <Link
      href={promotion.ctaUrl}
      target="_blank"
      rel="noreferrer"
      onClick={() => {
        trackPromotionClick("bell", promotion._id);
        onClose();
      }}
      className={`group flex items-center gap-3 border-b border-l-4 border-b-[#2a475e] bg-[#213246] px-4 py-3 transition-colors hover:bg-[#2a3f57] ${theme.bellEdge}`}>
      <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center text-2xl">
        {theme.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#c6d4df] transition-colors group-hover:text-white">
          {promotion.bellTitle}
        </p>
        {promotion.bellText ? <p className="mt-0.5 text-xs text-[#8f98a0]">{promotion.bellText}</p> : null}
      </div>
    </Link>
  );
}
