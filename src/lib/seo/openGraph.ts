import type { Metadata } from "next";

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

type OpenGraphImage = {
  url: string;
  secureUrl?: string;
  width?: number;
  height?: number;
  alt?: string;
};

export function buildOpenGraphImage(url: string, alt: string): OpenGraphImage {
  return {
    url,
    ...(url.startsWith("https://") ? { secureUrl: url } : {}),
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt
  };
}

export function buildOpenGraphWebsite(params: {
  title: string;
  description: string;
  url: string;
  siteName: string;
  ogImageUrl: string;
  ogImageAlt: string;
}): NonNullable<Metadata["openGraph"]> {
  return {
    title: params.title,
    description: params.description,
    url: params.url,
    siteName: params.siteName,
    type: "website",
    images: [buildOpenGraphImage(params.ogImageUrl, params.ogImageAlt)]
  };
}
