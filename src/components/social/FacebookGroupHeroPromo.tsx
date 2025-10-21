"use client";

import { FaFacebook, FaUsers, FaBell } from "react-icons/fa";
import { trackEvent } from "@/src/lib/trackEvent";
import Link from "next/link";
import { SocialData } from "@/src/types";
import { hasFacebookSocialLink, getFacebookSocialLink } from "@/src/lib/socialUtils";

interface FacebookGroupHeroPromoProps {
  socialData?: SocialData;
  className?: string;
  path?: string;
}

export function FacebookGroupHeroPromo({ socialData, className = "", path }: FacebookGroupHeroPromoProps) {
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

  return (
    <div
      className={`bg-gradient-to-r from-blue-600/10 to-blue-700/10 border border-blue-500/20 rounded-xl p-4 ${className}`}>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="hidden sm:block flex-shrink-0">
          <div className="bg-blue-600 p-2 rounded-lg">
            <FaFacebook className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-white">Stay Updated</h3>
            <FaBell className="h-3 w-3 text-blue-400" />
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            Join our Facebook group to get notified about new programs, CD keys, and website updates.
          </p>
        </div>
        <div className="flex-shrink-0 w-full sm:w-auto">
          <Link
            href={facebookUrl}
            target="_blank"
            rel="noreferrer"
            onClick={handleClick}
            className="inline-flex w-full sm:w-auto justify-center items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors">
            <FaUsers className="h-3 w-3" />
            Join Group
          </Link>
        </div>
      </div>
    </div>
  );
}
