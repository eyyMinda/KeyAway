import { ReactElement } from "react";
import Image from "next/image";
import { AnimatedSanityImage } from "@/src/components/general/AnimatedSanityImage";
import {
  resolveDisplayDimensions,
  sanityImageLqip,
  sanityImageNeedsMotionDelivery,
  sanityMotionImageUrl,
  sanityOptimizedImageUrl
} from "@/src/lib/sanity/imageDelivery";
import { urlFor } from "@/src/sanity/lib/image";
import { SanityAsset } from "@sanity/image-url";

export interface IdealImageProps {
  image?: SanityAsset;
  alt?: string;
  className?: string;
  sizes?: string;
  /** Max rendered width in CSS px — CDN request is sized to this (use ~2× for retina if needed). */
  widthHint?: number;
  quality?: number;
  priority?: boolean;
  fill?: boolean;
  /**
   * Set when the layout slot may contain animated WebP (about blocks, showcase).
   * GIF is always auto-detected. Static JPG/PNG/WebP without Studio flag stay on next/image.
   */
  mayAnimate?: boolean;
}

export const IdealImage = ({
  image,
  alt = "An image without an alt, whoops",
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  widthHint = 640,
  quality = 70,
  priority = false,
  fill = false,
  mayAnimate = false
}: IdealImageProps): ReactElement | null => {
  if (!image) return null;

  const hint = fill ? Math.max(widthHint, 1200) : widthHint;
  const needsMotion = sanityImageNeedsMotionDelivery(image, { mayAnimate });
  const display = resolveDisplayDimensions(image, hint);

  if (needsMotion) {
    return (
      <AnimatedSanityImage
        src={sanityMotionImageUrl(image, hint)}
        alt={alt}
        width={display.width}
        height={display.height}
        aspectRatio={display.aspectRatio}
        className={className}
        priority={priority}
        fill={fill}
      />
    );
  }

  const lqip = sanityImageLqip(image);
  const src = sanityOptimizedImageUrl(image, hint, quality);
  const blurDataURL = lqip ?? urlFor(image).width(24).height(24).blur(10).url();

  const shared = {
    src,
    alt,
    placeholder: "blur" as const,
    blurDataURL,
    sizes,
    priority,
    ...(priority ? { fetchPriority: "high" as const } : {}),
    ...(className ? { className } : {})
  };

  if (fill) {
    return <Image {...shared} fill />;
  }

  return <Image {...shared} width={display.width} height={display.height} />;
};
