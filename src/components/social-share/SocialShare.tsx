"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { FaFacebook, FaLinkedin, FaPinterest, FaShare, FaTelegram, FaTumblr, FaXTwitter } from "react-icons/fa6";
import type { IconType } from "react-icons";
import { trackEvent } from "@/src/lib/analytics/trackEvent";
import {
  buildShareUrl,
  SHARE_TRACKING_KEYS,
  type ShareCounts,
  type ShareNetworkId,
  type SharePayloadInput
} from "@/src/lib/share/buildSharePayload";
import "./social-share.css";

type NetworkConfig = {
  id: ShareNetworkId;
  label: string;
  ariaLabel: string;
  bg: string;
  text: string;
  badgeBg: string;
  badgeText: string;
  Icon: IconType;
};

export const SHARE_NETWORKS: NetworkConfig[] = [
  {
    id: "facebook",
    label: "Share",
    ariaLabel: "Share on Facebook",
    bg: "#4267B2",
    text: "#ffffff",
    badgeBg: "#29487d",
    badgeText: "#ffffff",
    Icon: FaFacebook
  },
  {
    id: "twitter",
    label: "Tweet",
    ariaLabel: "Share on X",
    bg: "#000000",
    text: "#ffffff",
    badgeBg: "#333333",
    badgeText: "#ffffff",
    Icon: FaXTwitter
  },
  {
    id: "telegram",
    label: "Share",
    ariaLabel: "Share on Telegram",
    bg: "#0088cc",
    text: "#ffffff",
    badgeBg: "#006699",
    badgeText: "#ffffff",
    Icon: FaTelegram
  },
  {
    id: "pinterest",
    label: "Pin",
    ariaLabel: "Share on Pinterest",
    bg: "#E60023",
    text: "#ffffff",
    badgeBg: "#ad001b",
    badgeText: "#ffffff",
    Icon: FaPinterest
  },
  {
    id: "tumblr",
    label: "Post",
    ariaLabel: "Share on Tumblr",
    bg: "#35465c",
    text: "#ffffff",
    badgeBg: "#222b37",
    badgeText: "#ffffff",
    Icon: FaTumblr
  },
  {
    id: "linkedin",
    label: "Share",
    ariaLabel: "Share on LinkedIn",
    bg: "#0077b5",
    text: "#ffffff",
    badgeBg: "#005885",
    badgeText: "#ffffff",
    Icon: FaLinkedin
  }
];

const POPUP_FEATURES =
  "width=626,height=436,left=120,top=120,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,noopener,noreferrer";

export type SocialShareProps = {
  variant?: "default" | "mini";
  shareId: string;
  shareInput: SharePayloadInput;
  programSlug?: string;
  shareCounts?: ShareCounts;
  ariaLabel?: string;
  className?: string;
  showCounts?: boolean;
};

export default function SocialShare({
  variant = "default",
  shareId,
  shareInput,
  programSlug,
  shareCounts = {},
  ariaLabel = "Share",
  className = "",
  showCounts = true
}: SocialShareProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const isMini = variant === "mini";

  const trackShare = useCallback(
    (network: ShareNetworkId) => {
      void trackEvent("social_click", {
        social: SHARE_TRACKING_KEYS[network],
        ...(programSlug ? { programSlug } : {}),
        path: pathname || "/"
      });
    },
    [pathname, programSlug]
  );

  const openShareWindow = useCallback(
    (url: string, network: ShareNetworkId) => {
      trackShare(network);
      const popup = window.open(url, `SocialShare_${shareId}_${network}`, POPUP_FEATURES);
      if (popup) popup.opener = null;
    },
    [shareId, trackShare]
  );

  const handleShareClick = (e: React.MouseEvent<HTMLAnchorElement>, network: ShareNetworkId, url: string) => {
    if (e.defaultPrevented || e.button !== 0) return;
    e.preventDefault();

    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      const tab = window.open(url, "_blank", "noopener,noreferrer");
      if (tab) tab.opener = null;
      trackShare(network);
      return;
    }

    openShareWindow(url, network);
  };

  const showToggle = !isMini && SHARE_NETWORKS.length > 3;
  const rootClass = [
    "social-share",
    "social-share--toggle-share-arrow",
    expanded ? "social-share--expanded" : "",
    isMini ? "social-share--mini" : "",
    !isMini ? className : ""
  ]
    .filter(Boolean)
    .join(" ");

  const bar = (
    <div className={rootClass} data-social-share-root>
      <div className="social-share__track" id={`social-share-track-${shareId}`}>
        {SHARE_NETWORKS.map(network => {
          const shareUrl = buildShareUrl(network.id, shareInput);
          const count = shareCounts[network.id];
          const { Icon } = network;

          return (
            <div key={network.id} className="social-share__item">
              <a
                href={shareUrl}
                className="social-share__link"
                rel="nofollow noreferrer"
                target="_blank"
                aria-label={network.ariaLabel}
                style={{ background: network.bg, color: network.text }}
                data-social-share-item
                onClick={e => handleShareClick(e, network.id, shareUrl)}>
                <span className="social-share__icon" aria-hidden>
                  <Icon />
                </span>
                <span className="social-share__label">{network.label}</span>
                {showCounts && !isMini && typeof count === "number" && count > 0 ? (
                  <span
                    className="social-share__count"
                    style={{ background: network.badgeBg, color: network.badgeText }}>
                    {count}
                  </span>
                ) : null}
              </a>
            </div>
          );
        })}
      </div>

      {showToggle ? (
        <button
          type="button"
          className="social-share__toggle"
          data-social-share-toggle
          aria-expanded={expanded}
          aria-controls={`social-share-track-${shareId}`}
          aria-label={expanded ? "Show fewer sharing options" : "Show more sharing options"}
          onClick={() => setExpanded(v => !v)}>
          <span className="social-share__toggle-icon" aria-hidden>
            <FaShare />
          </span>
        </button>
      ) : null}
    </div>
  );

  if (isMini) {
    return (
      <div aria-label={ariaLabel} className={className}>
        {bar}
      </div>
    );
  }

  return (
    <section
      className={`mx-auto w-full max-w-3xl px-4 pb-2 pt-2 sm:px-6 lg:max-w-360 lg:px-8 ${className}`.trim()}
      aria-label={ariaLabel}>
      {bar}
    </section>
  );
}
