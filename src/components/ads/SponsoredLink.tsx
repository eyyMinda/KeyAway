"use client";

/**
 * @fileoverview The Adsterra direct link as a plain, clearly labeled text link. Tracked like any ad unit (it is
 * always "filled"), so the admin Ads page shows how often it is seen and clicked per placement.
 */
import { useEffect, useRef, type ReactNode } from "react";
import { ADS_ENABLED, SMARTLINK_URL } from "@/src/lib/ads/adConfig";
import type { AdPlacementId } from "@/src/lib/ads/adPlacements";
import AdFrame from "./AdFrame";
import { useAdUnit } from "./useAdUnit";

function TrackedLink({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const { start, report } = useAdUnit("link", ref);

  useEffect(() => {
    start();
    report("filled");
  }, [start, report]);

  return (
    <a ref={ref} href={SMARTLINK_URL} target="_blank" rel="sponsored noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

type SponsoredLinkProps = {
  placement: AdPlacementId;
  className?: string;
  linkClassName: string;
  children: ReactNode;
};

export default function SponsoredLink({ placement, className = "", linkClassName, children }: SponsoredLinkProps) {
  if (!ADS_ENABLED) return null;
  return (
    <AdFrame placement={placement} className={className}>
      <TrackedLink className={linkClassName}>{children}</TrackedLink>
    </AdFrame>
  );
}
