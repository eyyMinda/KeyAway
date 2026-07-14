import Image from "next/image";
import { getImageDimensions, SanityImageSource } from "@sanity/asset-utils";
import { urlFor } from "@/src/sanity/lib/image";
import { resolveVendorLogoBackgroundColor } from "@/src/lib/vendors/resolveVendorLogoBackgroundColor";
import type { VendorLogoBackgroundColor } from "@/src/lib/vendors/resolveVendorLogoBackgroundColor";

type VendorLogoFrameProps = {
  name: string;
  logo?: SanityImageSource;
  logoBackgroundColor?: VendorLogoBackgroundColor | null;
  /** Max edge length (px) for the logo box and Sanity CDN width hint. */
  imageSize: number;
  /** Max rendered edge length inside the frame; defaults to half of imageSize. */
  displayMaxSize?: number;
  frameClassName: string;
  imageClassName?: string;
  alt?: string;
  fallbackClassName?: string;
};

function fitInsideBox(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return { width: maxWidth, height: maxHeight };
  }
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

export default function VendorLogoFrame({
  name,
  logo,
  logoBackgroundColor,
  imageSize,
  displayMaxSize,
  frameClassName,
  imageClassName = "block max-h-full max-w-full object-contain",
  alt,
  fallbackClassName = "text-base font-bold text-[#66c0f4]"
}: VendorLogoFrameProps) {
  const backgroundColor = resolveVendorLogoBackgroundColor(logoBackgroundColor);

  if (!logo) {
    return (
      <div className={frameClassName} style={backgroundColor ? { backgroundColor } : undefined}>
        <span className={fallbackClassName} aria-hidden>
          {name.charAt(0)}
        </span>
      </div>
    );
  }

  const intrinsic = getImageDimensions(logo as SanityImageSource);
  const boxMax = displayMaxSize ?? Math.round(imageSize / 2);
  const display = fitInsideBox(intrinsic.width, intrinsic.height, boxMax, boxMax);
  const imageAlt = alt ?? name;

  return (
    <div className={frameClassName} style={backgroundColor ? { backgroundColor } : undefined}>
      <div className={`flex h-full w-full items-center justify-center p-1`}>
        <Image
          src={urlFor(logo)
            .width(imageSize * 2)
            .fit("max")
            .auto("format")
            .url()}
          alt={imageAlt ?? ""}
          width={display.width}
          height={display.height}
          className={imageClassName}
          sizes={`${imageSize}px`}
          aria-hidden={imageAlt === "" || imageAlt === undefined}
        />
      </div>
    </div>
  );
}
