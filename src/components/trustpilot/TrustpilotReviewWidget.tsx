"use client";

export interface TrustpilotReviewWidgetProps {
  className?: string;
  reviewUrl?: string;
}

export default function TrustpilotReviewWidget({
  className,
  reviewUrl = "https://www.trustpilot.com/review/www.keyaway.app"
}: TrustpilotReviewWidgetProps) {
  return (
    <a
      href={reviewUrl}
      target="_blank"
      rel="noopener"
      className={`inline-flex items-center gap-2 justify-center border border-gray-200 bg-gray-100 rounded-lg py-2 px-4 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-200 hover:border-gray-600 ${className || ""}`}>
      <span>Leave a review on</span>
      <span className="inline-flex items-center gap-2 text-gray-900">
        <img src="/images/Trustpilot_Logo.png" alt="Trustpilot" className="max-w-20 w-auto h-5" />
      </span>
    </a>
  );
}
