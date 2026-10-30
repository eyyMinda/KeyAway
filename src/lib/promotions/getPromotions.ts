import { TAG_PROMOTIONS } from "@/src/lib/cache/cacheTags";
import { sitePromotionsQuery } from "@/src/lib/sanity/queries";
import { getCachedStoreDetailsDocument } from "@/src/lib/sanity/getCachedStoreDetails";
import { getFacebookSocialLink } from "@/src/lib/social/socialUtils";
import { client } from "@/src/sanity/lib/client";
import type { SitePromotion } from "@/src/types/promotions";

/**
 * Enabled promotions that have not ended, including future ones. Pages stay cached for hours, so the
 * browser decides what is live (`PromotionProvider`); `renderedAt` keeps hydration on the same answer.
 */
export async function getCachedPromotions(): Promise<{ promotions: SitePromotion[]; renderedAt: number }> {
  const [rows, store] = await Promise.all([
    client.fetch<Array<Omit<SitePromotion, "ctaUrl"> & { ctaUrl?: string }>>(
      sitePromotionsQuery,
      {},
      { next: { tags: [TAG_PROMOTIONS] } }
    ),
    getCachedStoreDetailsDocument()
  ]);

  const facebookUrl = getFacebookSocialLink({ socialLinks: store?.socialLinks ?? [] });
  const promotions = (rows ?? []).flatMap(row => {
    const ctaUrl = row.ctaUrl || facebookUrl;
    return ctaUrl ? [{ ...row, ctaUrl }] : [];
  });

  return { promotions, renderedAt: Date.now() };
}
