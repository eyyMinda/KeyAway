/**
 * Sanity Studio must not SSR: `@sanity/vision`, router, etc. touch `window` during render.
 * `next/dynamic` + `{ ssr: false }` can be flaky with Turbopack; defer with `useEffect` + dynamic import instead.
 */
"use client";

import { useEffect, useState, type ComponentType } from "react";

const loadingFallback = (
  <div
    style={{
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0d0d12",
      color: "#84868c",
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
      fontSize: 14
    }}>
    Loading Studio…
  </div>
);

export default function StudioPage() {
  const [Embedded, setEmbedded] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("./StudioEmbedded").then(m => {
      if (!cancelled) setEmbedded(() => m.default);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Embedded) return loadingFallback;
  return <Embedded />;
}
