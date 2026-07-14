import { getFacebookSocialLink, getTrustpilotReviewUrl } from "@/src/lib/social/socialUtils";

export type EmailFooterLinks = {
  facebookGroupUrl?: string | null;
  trustpilotUrl?: string | null;
  buyMeACoffeeUrl?: string | null;
  githubRepoUrl?: string | null;
};

type StoreForEmailFooter = {
  socialLinks?: Array<{ platform: string; url: string }>;
  otherLinks?: Array<{ kind: string; url?: string }>;
};

export function resolveEmailFooterLinks(store: StoreForEmailFooter | null | undefined): EmailFooterLinks {
  const socialData = { socialLinks: store?.socialLinks ?? [] };
  const other = store?.otherLinks ?? [];

  return {
    facebookGroupUrl: getFacebookSocialLink(socialData),
    trustpilotUrl: getTrustpilotReviewUrl(socialData),
    buyMeACoffeeUrl: other.find(e => e.kind === "buymeacoffee" && e.url?.trim())?.url?.trim() ?? null,
    githubRepoUrl: other.find(e => e.kind === "githubRepository" && e.url?.trim())?.url?.trim() ?? null
  };
}

export function emailFooterHasLinks(links: EmailFooterLinks): boolean {
  return Boolean(
    links.facebookGroupUrl || links.trustpilotUrl || links.buyMeACoffeeUrl || links.githubRepoUrl
  );
}
