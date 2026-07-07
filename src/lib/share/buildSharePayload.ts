export type ShareNetworkId = "facebook" | "twitter" | "telegram" | "pinterest" | "tumblr" | "linkedin";

export const SHARE_TRACKING_KEYS: Record<ShareNetworkId, string> = {
  facebook: "share-facebook",
  twitter: "share-twitter",
  telegram: "share-telegram",
  pinterest: "share-pinterest",
  tumblr: "share-tumblr",
  linkedin: "share-linkedin"
};

export type ShareCounts = Partial<Record<ShareNetworkId, number>>;

export interface SharePayloadInput {
  pageUrl: string;
  shareTitle: string;
  shareText: string;
  imageUrl?: string;
}

export interface ProgramShareInput {
  programTitle: string;
  programSlug: string;
  pageUrl: string;
  workingKeys?: number;
  imageUrl?: string;
}

export function buildProgramShareInput(input: ProgramShareInput): SharePayloadInput {
  const keys = input.workingKeys ?? 0;
  const keyLine = keys > 0 ? `${keys} working giveaway key${keys === 1 ? "" : "s"}` : "free giveaway keys";

  return {
    pageUrl: input.pageUrl,
    shareTitle: `${input.programTitle} — KeyAway`,
    shareText: `Free ${input.programTitle} on KeyAway — ${keyLine}. Grab yours before they expire! #KeyAway #FreeSoftware`,
    imageUrl: input.imageUrl
  };
}

export function buildProgramsIndexShareInput(
  pageUrl: string,
  programCount: number,
  totalKeys: number,
  imageUrl?: string
): SharePayloadInput {
  const programLine = programCount > 0 ? `${programCount}+ programs` : "hundreds of programs";
  const keyLine = totalKeys > 0 ? `${totalKeys}+ free giveaway keys` : "free giveaway CD keys";

  return {
    pageUrl,
    shareTitle: "All Programs — KeyAway",
    shareText: `Browse ${programLine} with ${keyLine} on KeyAway. #KeyAway #FreeSoftware`,
    imageUrl
  };
}

/** Generic page share — footer mini uses current URL + optional document title. */
export function buildPageShareInput(pageUrl: string, documentTitle?: string): SharePayloadInput {
  const cleanedTitle = documentTitle?.replace(/\s*[-|–]\s*KeyAway.*$/i, "").trim();
  const label = cleanedTitle || "KeyAway";

  return {
    pageUrl,
    shareTitle: `${label} — KeyAway`,
    shareText:
      label === "KeyAway"
        ? "Free giveaway CD keys for PC software on KeyAway. #KeyAway #FreeSoftware"
        : `Check out ${label} on KeyAway — free giveaway CD keys for PC software. #KeyAway #FreeSoftware`
  };
}

/** @deprecated Use buildProgramShareInput — kept for call sites passing ProgramShareInput shape. */
export function buildProgramShareText(input: ProgramShareInput): string {
  return buildProgramShareInput(input).shareText;
}

export function buildShareUrl(network: ShareNetworkId, input: SharePayloadInput): string {
  const encodedUrl = encodeURIComponent(input.pageUrl);
  const encodedText = encodeURIComponent(input.shareText);
  const encodedTitle = encodeURIComponent(input.shareTitle);

  switch (network) {
    case "facebook":
      return `https://www.facebook.com/sharer.php?u=${encodedUrl}`;
    case "twitter":
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "pinterest": {
      let url = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`;
      if (input.imageUrl) url += `&media=${encodeURIComponent(input.imageUrl)}`;
      return url;
    }
    case "tumblr":
      return `https://www.tumblr.com/widgets/share/tool?posttype=link&title=${encodedTitle}&caption=${encodedText}&content=${encodedUrl}&canonicalUrl=${encodedUrl}`;
    default:
      return input.pageUrl;
  }
}
