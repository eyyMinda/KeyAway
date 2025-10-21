"use client";

import { FaGithub, FaLinkedin, FaInstagram, FaYoutube, FaFacebook, FaGlobe } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { trackEvent } from "@/src/lib/trackEvent";
import Link from "next/link";

// Available social platforms from Sanity schema
export const SOCIAL_PLATFORMS = {
  github: { icon: FaGithub, name: "GitHub" },
  linkedin: { icon: FaLinkedin, name: "LinkedIn" },
  instagram: { icon: FaInstagram, name: "Instagram" },
  twitter: { icon: FaXTwitter, name: "X (Twitter)" },
  x: { icon: FaXTwitter, name: "X" },
  youtube: { icon: FaYoutube, name: "YouTube" },
  facebook: { icon: FaFacebook, name: "Facebook" },
  website: { icon: FaGlobe, name: "Website" },
  portfolio: { icon: FaGlobe, name: "Portfolio" }
} as const;

export type SocialPlatform = keyof typeof SOCIAL_PLATFORMS;

export interface SocialLink {
  platform: string;
  url: string;
}

interface SocialProps {
  platform: string;
  url: string;
  className?: string;
  iconSize?: string;
  showLabel?: boolean;
  trackClick?: boolean;
  path?: string;
}

interface SocialsProps {
  socialLinks: SocialLink[];
  className?: string;
  iconSize?: string;
  showLabels?: boolean;
  trackClicks?: boolean;
  path?: string;
}

/**
 * Renders a single social link
 */
export function Social({
  platform,
  url,
  className = "text-gray-300 hover:text-primary-500 transition-colors",
  iconSize = "h-6 w-6",
  showLabel = false,
  trackClick = true,
  path
}: SocialProps) {
  const normalizedPlatform = platform.toLowerCase() as SocialPlatform;
  const platformData = SOCIAL_PLATFORMS[normalizedPlatform];

  // If platform is not supported, don't render anything
  if (!platformData) {
    return null;
  }

  const IconComponent = platformData.icon;
  const displayName = platformData.name;

  const handleClick = () => {
    if (trackClick) {
      trackEvent("social_click", {
        social: platform,
        path: path || window.location.pathname
      });
    }
  };

  return (
    <Link href={url} target="_blank" rel="noreferrer" onClick={handleClick} className={className} title={displayName}>
      <span className="sr-only">{displayName}</span>
      <IconComponent className={iconSize} />
      {showLabel && <span className="ml-2 text-sm">{displayName}</span>}
    </Link>
  );
}

/**
 * Renders a list of social links
 */
export function Socials({
  socialLinks,
  className = "flex space-x-4",
  iconSize = "h-6 w-6",
  showLabels = false,
  trackClicks = true,
  path
}: SocialsProps) {
  // Filter out unsupported platforms
  const supportedLinks = socialLinks.filter(link => SOCIAL_PLATFORMS[link.platform.toLowerCase() as SocialPlatform]);

  if (supportedLinks.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {supportedLinks.map((social, index) => (
        <Social
          key={`${social.platform}-${index}`}
          platform={social.platform}
          url={social.url}
          iconSize={iconSize}
          showLabel={showLabels}
          trackClick={trackClicks}
          path={path}
        />
      ))}
    </div>
  );
}

/**
 * Renders social links in a vertical layout (useful for sidebars, etc.)
 */
export function SocialsVertical({
  socialLinks,
  className = "flex flex-col space-y-3",
  iconSize = "h-5 w-5",
  showLabels = true,
  trackClicks = true,
  path
}: SocialsProps) {
  return (
    <Socials
      socialLinks={socialLinks}
      className={className}
      iconSize={iconSize}
      showLabels={showLabels}
      trackClicks={trackClicks}
      path={path}
    />
  );
}

/**
 * Renders a single social link with larger styling (useful for CTAs, etc.)
 */
export function SocialLarge({
  platform,
  url,
  className = "inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors",
  iconSize = "h-5 w-5",
  showLabel = true,
  trackClick = true,
  path
}: SocialProps) {
  return (
    <Social
      platform={platform}
      url={url}
      className={className}
      iconSize={iconSize}
      showLabel={showLabel}
      trackClick={trackClick}
      path={path}
    />
  );
}
