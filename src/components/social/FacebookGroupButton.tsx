"use client";

import { FaUsers } from "react-icons/fa";
import { trackEvent } from "@/src/lib/analytics/trackEvent";
import Link from "next/link";
import { SocialData } from "@/src/types";
import { hasFacebookSocialLink, getFacebookSocialLink } from "@/src/lib/social/socialUtils";

const TAGLINE = "Get notified about new programs & CD keys";

interface FacebookGroupButtonProps {
  socialData?: SocialData;
  className?: string;
  path?: string;
  variant?: "primary" | "secondary" | "outline";
  /** `below` = caption under the link (default). `inside` = caption inside the button under “Join Group”. */
  taglinePlacement?: "below" | "inside";
  /** When false, tagline is omitted (both placements). Default true. */
  showTagline?: boolean;
}

export function FacebookGroupButton({
  socialData,
  className = "",
  path,
  variant = "primary",
  taglinePlacement = "below",
  showTagline = true
}: FacebookGroupButtonProps) {
  // Check if Facebook social link exists
  const hasFacebook = hasFacebookSocialLink(socialData);
  const facebookUrl = getFacebookSocialLink(socialData);

  const handleClick = () => {
    trackEvent("social_click", {
      social: "facebook",
      path: path || window.location.pathname
    });
  };

  // Don't render if no Facebook social link
  if (!hasFacebook || !facebookUrl) {
    return null;
  }

  const getVariantClasses = () => {
    switch (variant) {
      case "secondary":
        return "bg-gray-600 hover:bg-gray-700 text-white";
      case "outline":
        return "border-2 border-blue-500/70 text-blue-400 hover:bg-blue-500/20 hover:border-blue-400";
      default: // primary
        return "bg-blue-600 hover:bg-blue-700 text-white";
    }
  };

  const taglineMuted =
    variant === "outline" ? "text-blue-200/85" : variant === "secondary" ? "text-white/80" : "text-white/85";

  const linkBase = `rounded-lg font-medium transition-colors ${getVariantClasses()}`;

  const joinRow = (
    <>
      <FaUsers className="h-4 w-4 shrink-0" />
      <span>Join Group</span>
    </>
  );

  if (taglinePlacement === "inside") {
    return (
      <div className={`flex flex-col items-center text-start ${className}`}>
        <Link
          href={facebookUrl}
          target="_blank"
          rel="noreferrer"
          onClick={handleClick}
          className={
            showTagline
              ? `w-fit inline-flex flex-col items-start gap-1 px-4 py-2.5 ${linkBase}`
              : `w-fit inline-flex items-center gap-2 px-4 py-2 ${linkBase}`
          }>
          {showTagline ? (
            <>
              <span className="inline-flex items-center gap-2">{joinRow}</span>
              <span className={`text-start text-[10px] leading-snug font-normal sm:text-xs ${taglineMuted}`}>
                {TAGLINE}
              </span>
            </>
          ) : (
            joinRow
          )}
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <Link
        href={facebookUrl}
        target="_blank"
        rel="noreferrer"
        onClick={handleClick}
        className={`w-fit inline-flex items-center gap-2 px-4 py-2 ${linkBase}`}>
        <FaUsers className="h-4 w-4" />
        <span>Join Group</span>
      </Link>
      {showTagline ? <span className="mt-1 text-xs leading-tight text-gray-400">{TAGLINE}</span> : null}
    </div>
  );
}
