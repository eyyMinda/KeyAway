import { SocialData } from "@/src/types";

/**
 * Checks if Facebook social link exists in the social data
 */
export function hasFacebookSocialLink(socialData?: SocialData): boolean {
  if (!socialData?.socialLinks) {
    return false;
  }

  return socialData.socialLinks.some(link => link.platform.toLowerCase() === "facebook");
}

/**
 * Gets the Facebook social link URL from social data
 */
export function getFacebookSocialLink(socialData?: SocialData): string | null {
  if (!socialData?.socialLinks) {
    return null;
  }

  const facebookLink = socialData.socialLinks.find(link => link.platform.toLowerCase() === "facebook");

  return facebookLink?.url || null;
}
