import type { SanityImageSource } from "@sanity/image-url";
import { getImageDimensions } from "@sanity/asset-utils";
import { urlFor } from "@/src/sanity/lib/image";

/** Max CSS px width for about-section side images (matches AboutSectionBlock layout). */
export const ABOUT_SECTION_IMAGE_MAX_PX = 540;

export type SanityImageField = {
  preserveAnimation?: boolean;
  asset?: {
    _ref?: string;
    mimeType?: string;
    url?: string;
    metadata?: {
      dimensions?: { width: number; height: number; aspectRatio?: number };
      lqip?: string;
    };
  };
};

export type MotionSlotOptions = {
  /** Slot may contain animated WebP (about blocks, showcase). Static JPG/PNG still use next/image. */
  mayAnimate?: boolean;
};

function getAsset(source: SanityImageSource): SanityImageField["asset"] | undefined {
  if (!source || typeof source !== "object") return undefined;
  return (source as SanityImageField).asset;
}

function isGifAsset(asset: NonNullable<SanityImageField["asset"]>): boolean {
  const mime = asset.mimeType?.toLowerCase();
  if (mime === "image/gif") return true;

  const ref = asset._ref?.toLowerCase() ?? "";
  if (ref.includes("-gif") || ref.endsWith("gif")) return true;

  const url = asset.url?.toLowerCase() ?? "";
  return url.includes(".gif");
}

export function isGifImageSource(source: SanityImageSource | undefined | null): boolean {
  const asset = getAsset(source as SanityImageSource);
  return asset ? isGifAsset(asset) : false;
}

export function isWebpImageSource(source: SanityImageSource | undefined | null): boolean {
  const asset = getAsset(source as SanityImageSource);
  if (!asset) return false;

  const mime = asset.mimeType?.toLowerCase();
  if (mime === "image/webp") return true;

  const ref = asset._ref?.toLowerCase() ?? "";
  if (ref.includes("-webp") || ref.endsWith("webp")) return true;

  const url = asset.url?.toLowerCase() ?? "";
  return url.includes(".webp");
}

/**
 * True when the image must bypass next/image (GIF, flagged/slot WebP).
 * JPG/PNG always false — even with preserveAnimation checked by mistake in Studio.
 */
export function sanityImageNeedsMotionDelivery(
  source: SanityImageSource | undefined | null,
  options: MotionSlotOptions = {}
): boolean {
  if (!source || typeof source !== "object") return false;

  const image = source as SanityImageField;
  const asset = image.asset;
  if (!asset) return false;

  if (isGifAsset(asset)) return true;

  const webp = isWebpImageSource(source);
  if (webp && (options.mayAnimate || image.preserveAnimation === true)) return true;

  return false;
}

export function sanityImageLqip(source: SanityImageSource | undefined | null): string | undefined {
  if (!source || typeof source !== "object") return undefined;
  return (source as SanityImageField).asset?.metadata?.lqip;
}

export function resolveSanityImageDimensions(
  source: SanityImageSource,
  fallbackWidth = 640
): { width: number; height: number } {
  const fromMeta = (source as SanityImageField).asset?.metadata?.dimensions;
  if (fromMeta?.width && fromMeta?.height) {
    return { width: fromMeta.width, height: fromMeta.height };
  }

  try {
    return getImageDimensions(source as Parameters<typeof getImageDimensions>[0]);
  } catch {
    return { width: fallbackWidth, height: Math.round(fallbackWidth * 0.5625) };
  }
}

/** Intrinsic dimensions scaled to `maxWidth` for HTML width/height hints and aspect-ratio box. */
export function resolveDisplayDimensions(
  source: SanityImageSource,
  maxWidth: number
): { width: number; height: number; aspectRatio: number } {
  const intrinsic = resolveSanityImageDimensions(source, maxWidth);
  const aspectRatio = intrinsic.width / intrinsic.height;

  if (intrinsic.width <= maxWidth) {
    return { ...intrinsic, aspectRatio };
  }

  return {
    width: maxWidth,
    height: Math.round(maxWidth / aspectRatio),
    aspectRatio
  };
}

/** CDN URL for GIF / animated WebP — sized to `widthHint`, no auto-format conversion. */
export function sanityMotionImageUrl(source: SanityImageSource, widthHint: number): string {
  if (isWebpImageSource(source)) {
    return urlFor(source).width(widthHint).format("webp").url();
  }

  if (isGifImageSource(source)) {
    return urlFor(source).width(widthHint).fit("max").format("webp").quality(80).url();
  }

  return urlFor(source).width(widthHint).quality(80).auto("format").url();
}

/** Optimized static image URL for next/image. */
export function sanityOptimizedImageUrl(source: SanityImageSource, widthHint: number, quality: number): string {
  return urlFor(source).width(widthHint).quality(quality).auto("format").url();
}
