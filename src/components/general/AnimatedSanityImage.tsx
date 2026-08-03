"use client";

import { ReactElement } from "react";

type AnimatedSanityImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  aspectRatio: number;
  className?: string;
  priority: boolean;
  fill: boolean;
};

export function AnimatedSanityImage({
  src,
  alt,
  width,
  height,
  aspectRatio,
  className,
  priority,
  fill
}: AnimatedSanityImageProps): ReactElement {
  const imgProps = {
    src,
    alt,
    loading: priority ? ("eager" as const) : ("lazy" as const),
    decoding: "async" as const,
    ...(priority ? { fetchPriority: "high" as const } : {})
  };

  if (fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- motion assets bypass next/image
      <img {...imgProps} className={className ?? "absolute inset-0 h-full w-full object-cover object-center"} />
    );
  }

  return (
    <span className="relative block w-full" style={{ aspectRatio }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- motion assets bypass next/image */}
      <img
        {...imgProps}
        width={width}
        height={height}
        className={`block h-auto w-full ${className ?? ""}`.trim()}
      />
    </span>
  );
}
