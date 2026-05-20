"use client";

import { usePathname } from "next/navigation";
import { trackEvent } from "@/src/lib/analytics/trackEvent";

export interface TrustpilotReviewWidgetProps {
  className?: string;
  /** Required — parent should only render this component when a Trustpilot URL exists in CMS. */
  reviewUrl: string;
}

export default function TrustpilotReviewWidget({ className, reviewUrl }: TrustpilotReviewWidgetProps) {
  const pathname = usePathname();

  const handleClick = () => {
    void trackEvent("social_click", { social: "trustpilot", path: pathname || "/" });
  };

  return (
    <a
      href={reviewUrl}
      target="_blank"
      rel="noopener"
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-black transition-colors hover:border-gray-600 hover:bg-gray-200 hover:text-black ${className || ""}`}>
      <span>Leave a review on</span>
      <span className="inline-flex items-center gap-2 text-black">
        <img
          src="/images/Trustpilot_Logo.png"
          alt="Trustpilot"
          width={80}
          height={20}
          className="max-w-20 w-auto h-5"
        />
      </span>
    </a>
  );
}
