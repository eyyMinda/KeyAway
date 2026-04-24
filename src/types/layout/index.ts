// Layout and UI related types
import type { PortableTextBlock } from "@portabletext/types";
import { SanityAsset } from "@sanity/image-url";
import type { Notification } from "@/src/types/notifications";

/** Site-wide SEO templates on `storeDetails` (placeholder: `[title]` = store title or default name). */
export interface StoreSeo {
  siteUrl?: string;
  sharingImage?: SanityAsset;
  homeMetaTitle?: string;
  homeMetaDescription?: string;
  /** Each entry may include `[title]` (store name). */
  homeMetaKeywords?: string[];
  programsMetaTitle?: string;
  programsMetaDescription?: string;
  programsMetaKeywords?: string[];
  privacyMetaTitle?: string;
  privacyMetaDescription?: string;
  privacyMetaKeywords?: string[];
  termsMetaTitle?: string;
  termsMetaDescription?: string;
  termsMetaKeywords?: string[];
}

export interface StoreDetails {
  title: string;
  /** Public contact; empty in CMS → `DEFAULT_SUPPORT_EMAIL`. */
  supportEmail?: string;
  description?: PortableTextBlock[] | string;
  logo: SanityAsset;
  logoLight: SanityAsset;
  header: HeaderContent;
  footer: FooterContent;
  socialLinks?: SocialLink[];
  otherLinks?: StoreOtherLink[];
  seo?: StoreSeo;
}

export interface HeaderContent {
  isLogo: boolean;
  headerLinks: SanityLink[];
}

export interface FooterContent {
  isLogo: boolean;
  footerLinks: SanityLink[];
}

export interface SanityLink {
  title: string;
  slug?: { current: string };
  external: boolean;
  url?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

/** `storeDetails.otherLinks[].kind` — matches Sanity `storeOtherLink`. */
export type StoreOtherLinkKind = "buymeacoffee" | "githubRepository" | "other";

export interface StoreOtherLink {
  kind: StoreOtherLinkKind;
  url: string;
}

export interface SocialData {
  socialLinks: SocialLink[];
}

export interface LogoData {
  src: string;
  alt: string;
  /** Intrinsic dimensions for layout (aspect ratio); CDN request width uses `widthHint`. */
  width: number;
  height: number;
  blurDataURL: string;
  /** Passed to `urlFor` width; should match largest slot in `sizes`. */
  widthHint?: number;
  sizes?: string;
  quality?: number;
}

// Component props
export interface HeaderProps {
  logoData: LogoData;
  /** When omitted, Header fetches `/api/v1/notifications/recent` after mount. */
  notifications?: Notification[];
  socialData?: SocialData;
}

export interface FooterProps {
  logoData: LogoData;
  socialData: SocialData;
}

export interface MobileMenuProps {
  headerLinks?: SanityLink[];
  isOpen: boolean;
  onClose: () => void;
}
