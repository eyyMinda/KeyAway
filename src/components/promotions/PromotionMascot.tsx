"use client";

import Image from "next/image";

interface PromotionMascotProps {
  src?: string;
  className?: string;
}

/** Decorative floating image; the parent button needs `relative`. */
export default function PromotionMascot({ src, className = "" }: PromotionMascotProps) {
  if (!src) return null;

  return (
    <Image
      src={src}
      alt=""
      width={48}
      height={73}
      unoptimized
      className={`pointer-events-none absolute z-2 h-auto max-w-none animate-mascot-hover ${className}`}
    />
  );
}
