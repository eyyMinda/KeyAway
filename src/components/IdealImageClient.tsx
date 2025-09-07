"use client";

import { ReactElement } from "react";
import Image from "next/image";

interface IdealImageProps {
  alt?: string;
  className?: string;
  src?: string;
  width?: number;
  height?: number;
  blurDataURL?: string;
}

export const IdealImageClient = ({
  src = "",
  width = 0,
  height = 0,
  blurDataURL = "",
  alt = "An image without an alt, whoops",
  className
}: IdealImageProps): ReactElement | null => {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      placeholder="blur"
      blurDataURL={blurDataURL}
      sizes="
        (max-width: 768px) 100vw,
        (max-width: 1200px) 50vw,
        40vw"
      {...(className ? { className } : {})}
    />
  );
};
