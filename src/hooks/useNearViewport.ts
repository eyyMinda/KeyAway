"use client";

import { useEffect, useState, type RefObject } from "react";

/** True once the element comes within `rootMargin` of the viewport; stays true afterwards. */
export function useNearViewport(ref: RefObject<Element | null>, rootMargin = "400px 0px"): boolean {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin, near]);

  return near;
}
