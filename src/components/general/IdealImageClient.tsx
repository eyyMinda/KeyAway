"use client";

import { ReactElement } from "react";
import Image from "next/image";
import type { IdealImageClientProps } from "@/src/types/general";

const DEFAULT_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw";
const DEFAULT_QUALITY = 70;

export const IdealImageClient = ({
  src = "",
  width = 0,
  height = 0,
  blurDataURL = "",
  alt = "An image without an alt, whoops",
  className,
  widthHint: _widthHintOmit,
  sizes = DEFAULT_SIZES,
  quality = DEFAULT_QUALITY,
  priority = false
}: IdealImageClientProps): ReactElement | null => {
  if (!src || !width || !height) return null;

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      placeholder="blur"
      blurDataURL={blurDataURL}
      sizes={sizes}
      quality={quality}
      priority={priority}
      {...(priority ? { fetchPriority: "high" as const } : {})}
      {...(className ? { className } : {})}
    />
  );
};
