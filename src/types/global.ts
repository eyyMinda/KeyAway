import { SanityAsset } from "@sanity/image-url/lib/types/types";

export type StoreDetails = {
  title: string;
  description: string;
  logo: SanityAsset;
  logoLight: SanityAsset;
  header: HeaderContent;
  footer: FooterContent;
};

export type HeaderContent = {
  isLogo: boolean;
  headerLinks: SanityLink[];
};

export type FooterContent = {
  isLogo: boolean;
  footerLinks: SanityLink[];
};

export type SanityLink = {
  title: string;
  slug?: { current: string };
  external: boolean;
  url?: string;
};

export type LogoData = {
  src: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL: string;
};
