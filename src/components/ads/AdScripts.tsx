"use client";

/** @fileoverview Site-wide social bar script; loads only with ad consent, never on admin/studio. */
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useAdConsent } from "@/src/hooks/useAdConsent";
import { ADS_ENABLED, SOCIAL_BAR_SCRIPT_SRC, isAdExcludedPath } from "@/src/lib/ads/adConfig";

export default function AdScripts() {
  const pathname = usePathname();
  const { status } = useAdConsent();
  if (!ADS_ENABLED || isAdExcludedPath(pathname) || status !== "granted") return null;

  return <Script id="ad-social-bar" src={SOCIAL_BAR_SCRIPT_SRC} strategy="lazyOnload" data-cfasync="false" />;
}
