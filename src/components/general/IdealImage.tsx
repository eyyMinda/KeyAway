import { ReactElement } from "react";
import Image from "next/image";
import { getImageDimensions } from "@sanity/asset-utils";
import { urlFor } from "@/src/sanity/lib/image";
import { SanityAsset } from "@sanity/image-url/lib/types/types";

interface IdealImageProps {
  image?: SanityAsset;
  alt?: string;
  className?: string;
}

export const IdealImage = ({
  image,
  alt = "An image without an alt, whoops",
  className
}: IdealImageProps): ReactElement | null => {
  if (!image) return null;
  return (
    <Image
      src={urlFor(image).url()}
      alt={alt}
      width={getImageDimensions(image).width}
      height={getImageDimensions(image).height}
      placeholder="blur"
      blurDataURL={urlFor(image).width(24).height(24).blur(10).url()}
      sizes="
        (max-width: 768px) 100vw,
        (max-width: 1200px) 50vw,
        40vw"
      {...(className ? { className } : {})}
    />
  );
};
