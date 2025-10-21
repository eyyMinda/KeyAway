"use client";

import { FaFacebook, FaUsers } from "react-icons/fa";
import { trackEvent } from "@/src/lib/trackEvent";
import Link from "next/link";
import { SocialData } from "@/src/types";
import { hasFacebookSocialLink, getFacebookSocialLink } from "@/src/lib/socialUtils";

interface FacebookGroupButtonProps {
  socialData?: SocialData;
  className?: string;
  path?: string;
  variant?: "primary" | "secondary" | "outline";
}

export function FacebookGroupButton({
  socialData,
  className = "",
  path,
  variant = "primary"
}: FacebookGroupButtonProps) {
  // Check if Facebook social link exists
  const hasFacebook = hasFacebookSocialLink(socialData);
  const facebookUrl = getFacebookSocialLink(socialData);

  const handleClick = () => {
    trackEvent("facebook_group_click", {
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

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <Link
        href={facebookUrl}
        target="_blank"
        rel="noreferrer"
        onClick={handleClick}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${getVariantClasses()}`}>
        <FaUsers className="h-4 w-4" />
        <span>Join Group</span>
      </Link>
      <span className="text-xs text-gray-400 mt-1 leading-tight">Get notified about new programs & CD keys</span>
    </div>
  );
}
