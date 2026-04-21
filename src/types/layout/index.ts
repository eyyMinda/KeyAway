// Layout and UI related types
import { SanityAsset } from "@sanity/image-url";

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
  description: string;
  logo: SanityAsset;
  logoLight: SanityAsset;
  header: HeaderContent;
  footer: FooterContent;
  /** Embedded on `storeDetails` (no separate `socialLink` documents). */
  socialLinks?: SocialLink[];
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

export interface SocialData {
  socialLinks: SocialLink[];
}

export interface LogoData {
  src: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL: string;
}

// Component props
export interface HeaderProps {
  storeData: StoreDetails;
  logoData: LogoData;
}

export interface FooterProps {
  storeData: StoreDetails;
  logoData: LogoData;
  socialData: SocialData;
}

export interface MobileMenuProps {
  headerLinks?: SanityLink[];
  isOpen: boolean;
  onClose: () => void;
}
