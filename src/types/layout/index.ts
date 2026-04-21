// Layout and UI related types
import { SanityAsset } from "@sanity/image-url";

/** Site-wide SEO templates on `storeDetails` (placeholders: `[title]`, `[totalPrograms]`, `[totalProgramsRounded]`). */
export interface StoreSeo {
  siteUrl?: string;
  sharingImage?: SanityAsset;
  homeMetaTitle?: string;
  homeMetaDescription?: string;
  programsMetaTitle?: string;
  programsMetaDescription?: string;
  privacyMetaTitle?: string;
  privacyMetaDescription?: string;
  termsMetaTitle?: string;
  termsMetaDescription?: string;
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
  /** From GROQ `count(*[_type == "program"])` when using `storeDetailsQuery`. */
  programCount?: number;
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
