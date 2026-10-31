"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";

/**
 * Public site link that prefetches on hover or focus instead of on entering the viewport. Each prefetch is a billed
 * CDN request, and a page of cards would otherwise fetch dozens of pages nobody opens.
 */
export default function HoverPrefetchLink({ onMouseEnter, onFocus, ...props }: ComponentProps<typeof Link>) {
  const [intent, setIntent] = useState(false);

  return (
    <Link
      {...props}
      prefetch={intent ? null : false}
      onMouseEnter={event => {
        setIntent(true);
        onMouseEnter?.(event);
      }}
      onFocus={event => {
        setIntent(true);
        onFocus?.(event);
      }}
    />
  );
}
