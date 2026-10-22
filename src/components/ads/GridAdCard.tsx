"use client";

/**
 * @fileoverview Program-grid cell holding the 160×300 banner, framed like a `ProgramCard`. The banner scales up
 * to fill the cell: on desktop the row height comes from the neighbouring program cards; on the one-column
 * mobile grid `min-h-95` gives it room to grow (~203×380). Hidden while ad consent is pending or refused, and the
 * cell disappears (grid closes the gap) when no ad renders.
 */
import { useAdConsent } from "@/src/hooks/useAdConsent";
import { ADS_ENABLED, CARD_BANNER_FORMAT } from "@/src/lib/ads/adConfig";
import AdFrame from "./AdFrame";
import BannerAd from "./BannerAd";

const CARD_FORMATS = [CARD_BANNER_FORMAT];

/** `index` is 1-based within its grid and becomes the `grid-N` placement id. */
export default function GridAdCard({ index }: { index: number }) {
  const { status } = useAdConsent();
  if (!ADS_ENABLED || status === "pending" || status === "denied") return null;

  return (
    <AdFrame placement={`grid-${index}`} className="card-base no-hover flex flex-col gap-2 rounded-sm p-4">
      <div className="section-label-plain text-center text-[10px] text-neutral-200">Advertisement</div>
      <BannerAd formats={CARD_FORMATS} fill unit="card" className="min-h-95 flex-1" />
    </AdFrame>
  );
}
