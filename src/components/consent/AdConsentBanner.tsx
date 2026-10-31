"use client";

/**
 * @fileoverview Advertising consent banner. Opens on first visit in opt-in regions and again from the footer
 * "Your privacy choices" link. Non-blocking: the site stays usable while it is open.
 */
import { useEffect } from "react";
import Link from "@/src/components/ui/HoverPrefetchLink";
import { usePathname } from "next/navigation";
import { useAdConsent } from "@/src/hooks/useAdConsent";
import { ADS_ENABLED, isAdExcludedPath } from "@/src/lib/ads/adConfig";
import { closeAdConsentPreferences, initAdConsent, setAdConsent } from "@/src/lib/consent/adConsent";
import { ModalCloseButton } from "@/src/components/ui/ModalCloseButton";

const BUTTON_CLASS =
  "flex-1 cursor-pointer rounded-sm border px-4 py-2 text-sm font-semibold transition-colors sm:flex-none sm:px-6";

export default function AdConsentBanner() {
  const pathname = usePathname();
  const { status, preferencesOpen } = useAdConsent();
  const excluded = !ADS_ENABLED || isAdExcludedPath(pathname);

  useEffect(() => {
    if (!excluded) void initAdConsent();
  }, [excluded]);

  if (excluded || !preferencesOpen) return null;

  const isFirstChoice = status === "pending";

  return (
    <div
      role="dialog"
      aria-labelledby="ad-consent-title"
      aria-describedby="ad-consent-text"
      className="fixed inset-x-0 bottom-0 z-60 p-3 sm:p-4">
      <div className="relative mx-auto max-w-3xl rounded-sm border border-[#2a475e] bg-[#16202d] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] sm:p-5">
        {!isFirstChoice && (
          <div className="absolute right-2 top-2">
            <ModalCloseButton onClick={closeAdConsentPreferences} />
          </div>
        )}
        <h2 id="ad-consent-title" className="pr-8 text-base font-semibold sm:text-lg">
          Your privacy choices
        </h2>
        <p id="ad-consent-text" className="mt-2 text-sm leading-relaxed text-[#c6d4df]">
          KeyAway is free thanks to ads. With your permission, our advertising partner uses cookies and similar
          technologies to show and measure ads, which may involve your device and browsing data. Storage the site
          needs to work is always on. You can change your choice at any time from{" "}
          <span className="text-white">Your privacy choices</span> in the footer. Details are in our{" "}
          <Link href="/privacy" className="text-[#66d9ff] underline hover:text-white">
            Privacy Policy
          </Link>
          .
        </p>
        {!isFirstChoice && (
          <p className="mt-2 text-xs text-neutral-200">
            Current choice: advertising cookies are {status === "granted" ? "allowed" : "not allowed"}.
          </p>
        )}
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => setAdConsent(false)}
            className={`${BUTTON_CLASS} border-[#4a90c4] bg-[#1a3a5c] text-[#c6d4df] hover:bg-[#213246] hover:text-white`}>
            Reject
          </button>
          <button
            type="button"
            onClick={() => setAdConsent(true)}
            className={`${BUTTON_CLASS} border-[#4a90c4] bg-[#1a3a5c] text-[#c6d4df] hover:bg-[#213246] hover:text-white`}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
