// Layout and UI related types
import { SanityAsset } from "@sanity/image-url/lib/types/types";

export interface StoreDetails {
  title: string;
  description: string;
  logo: SanityAsset;
  logoLight: SanityAsset;
  header: HeaderContent;
  footer: FooterContent;
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
