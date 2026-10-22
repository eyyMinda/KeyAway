"use client";

/**
 * @fileoverview Sticky 160×300 banners in the empty gutters beside the `max-w-360` content column. Only on screens
 * wide enough to fit them without touching the content (1440 + 2 × (160 + 32) px), so the layout never changes.
 */
import { useAdConsent } from "@/src/hooks/useAdConsent";
import { ADS_ENABLED, CARD_BANNER_FORMAT } from "@/src/lib/ads/adConfig";
import AdFrame from "./AdFrame";
import BannerAd from "./BannerAd";

const RAIL_FORMATS = [CARD_BANNER_FORMAT];

export default function AdRails() {
  const { status } = useAdConsent();
  if (!ADS_ENABLED || status === "pending" || status === "denied") return null;

  return (
    <>
      {(["left", "right"] as const).map(side => (
        <AdFrame
          key={side}
          placement={`rail-${side}`}
          className={`fixed top-28 z-10 hidden w-40 min-[1824px]:block ${side === "left" ? "left-4" : "right-4"}`}>
          <div className="section-label-plain mb-1.5 text-center text-[10px] text-neutral-200">Advertisement</div>
          <BannerAd formats={RAIL_FORMATS} unit="rail" />
        </AdFrame>
      ))}
    </>
  );
}
