import { ReactElement } from "react";
import Image from "next/image";
import { getImageDimensions } from "@sanity/asset-utils";
import { urlFor } from "@/src/sanity/lib/image";
import { SanityAsset } from "@sanity/image-url";

interface IdealImageProps {
  image?: SanityAsset;
  alt?: string;
  className?: string;
  sizes?: string;
  widthHint?: number;
  quality?: number;
  /** When true: preload, eager load, and `fetchPriority="high"`. */
  priority?: boolean;
}

export const IdealImage = ({
  image,
  alt = "An image without an alt, whoops",
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  widthHint = 640,
  quality = 70,
  priority = false
}: IdealImageProps): ReactElement | null => {
  if (!image) return null;
  const src = urlFor(image).width(widthHint).quality(quality).auto("format").url();
  const blurDataURL = urlFor(image).width(24).height(24).blur(10).url();

  return (
    <Image
      src={src}
      alt={alt}
      width={getImageDimensions(image).width}
      height={getImageDimensions(image).height}
      placeholder="blur"
      blurDataURL={blurDataURL}
      sizes={sizes}
      priority={priority}
      {...(priority ? { fetchPriority: "high" as const } : {})}
      {...(className ? { className } : {})}
    />
  );
};
