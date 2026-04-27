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
  /**
   * Cover a sized parent (`relative` + explicit size or aspect). Omit width/height on `Image`;
   * use `className` for `object-cover` / positioning.
   */
  fill?: boolean;
}

export const IdealImage = ({
  image,
  alt = "An image without an alt, whoops",
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  widthHint = 640,
  quality = 70,
  priority = false,
  fill = false
}: IdealImageProps): ReactElement | null => {
  if (!image) return null;
  const hint = fill ? Math.max(widthHint, 1200) : widthHint;
  const src = urlFor(image).width(hint).quality(quality).auto("format").url();
  const blurDataURL = urlFor(image).width(24).height(24).blur(10).url();

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

  return (
    <Image
      {...shared}
      width={getImageDimensions(image).width}
      height={getImageDimensions(image).height}
      {...(src.includes(".gif") ? { unoptimized: true } : {})}
    />
  );
};
