"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import PromotionMascot from "@components/promotions/PromotionMascot";
import { useActivePromotion } from "@components/providers/PromotionProvider";
import { getPromotionTheme } from "@/src/lib/promotions/promotionThemes";
import { trackPromotionClick } from "@/src/lib/promotions/promotionUtils";

/** Slim campaign strip under the sticky header, on every public page. */
export default function PromotionBanner() {
  const promotion = useActivePromotion();
  const pathname = usePathname();

  if (!promotion?.bannerText || pathname.startsWith("/admin") || pathname.startsWith("/studio")) return null;

  const theme = getPromotionTheme(promotion.theme);

  return (
    <aside aria-label="Promotion" className={`border-b ${theme.surface}`}>
      <div className="mx-auto flex max-w-360 flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-4 py-2 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-medium">
          <span aria-hidden className="mr-1.5">
            {theme.emoji}
          </span>
          {promotion.bannerText}
        </p>
        <div className="relative shrink-0">
          <Link
            href={promotion.ctaUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackPromotionClick("banner")}
            className={`inline-block rounded-sm px-3 py-1 text-xs font-bold transition-colors ${theme.button}`}>
            {promotion.ctaLabel}
          </Link>
          <PromotionMascot src={promotion.bannerMascotUrl || promotion.mascotUrl} className="-right-9 -top-1 w-8" />
        </div>
      </div>
    </aside>
  );
}
