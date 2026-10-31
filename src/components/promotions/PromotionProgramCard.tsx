"use client";

import Link from "@/src/components/ui/HoverPrefetchLink";
import PromotionMascot from "@/src/components/promotions/PromotionMascot";
import { getPromotionTheme } from "@/src/lib/promotions/promotionThemes";
import { resolvePromotionCardTitle, trackPromotionClick } from "@/src/lib/promotions/promotionUtils";
import type { SitePromotion } from "@/src/types/promotions";

interface PromotionProgramCardProps {
  promotion: SitePromotion;
  programSlug: string;
  programTitle: string;
}

/** Stands in for `FacebookGroupHeroPromo` while a promotion with card text is live. */
export default function PromotionProgramCard({ promotion, programSlug, programTitle }: PromotionProgramCardProps) {
  const theme = getPromotionTheme(promotion.theme);
  const title = resolvePromotionCardTitle(promotion, programSlug, programTitle);

  return (
    <div className={`rounded-sm border p-4 ${theme.surface}`}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <span aria-hidden className="hidden shrink-0 text-2xl leading-none sm:block">
          {theme.emoji}
        </span>
        <div className="min-w-0 flex-1">
          {title ? <p className="mb-1 text-sm font-semibold text-white">{title}</p> : null}
          <p className="text-xs leading-relaxed">{promotion.cardText}</p>
        </div>
        <div className="relative w-full shrink-0 sm:w-auto">
          <Link
            href={promotion.ctaUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackPromotionClick("program", promotion._id)}
            className={`inline-flex w-full items-center justify-center rounded-sm px-3 py-2 text-xs font-bold transition-colors sm:w-auto ${
              promotion.mascotUrl ? "sm:pr-8" : ""
            } ${theme.button}`}>
            {promotion.ctaLabel}
          </Link>
          <PromotionMascot src={promotion.mascotUrl} className="-right-6 -top-[34px] w-12" />
        </div>
      </div>
    </div>
  );
}
