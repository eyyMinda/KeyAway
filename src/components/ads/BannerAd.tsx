"use client";

/**
 * @fileoverview Responsive iframe banner: picks the widest of `formats` (default `BANNER_FORMATS`) that fits
 * the container, and loads only once it nears the viewport with ad consent. Each banner runs in its own `srcdoc`
 * iframe because the banner script reads the global `atOptions` and uses `document.write`, neither of which works
 * for several units (or client-side navigation) in the main document. The `srcdoc` frame shares our origin, so we
 * can look inside it to tell whether an ad actually rendered (an ad blocker leaves it empty).
 */
import { useEffect, useRef, useState } from "react";
import { useAdConsent } from "@/src/hooks/useAdConsent";
import { useNearViewport } from "@/src/hooks/useNearViewport";
import { BANNER_FORMATS, BANNER_SCRIPT_BASE, type BannerFormat } from "@/src/lib/ads/adConfig";
import type { AdUnitKind } from "@/src/lib/ads/adPlacements";
import { hasRenderedAd, useAdUnit } from "./useAdUnit";

/** Upscaling blurs raster creatives, so `fill` stops here. */
const MAX_FILL_SCALE = 1.5;
const FILL_POLL_MS = 500;
const FILL_TIMEOUT_MS = 8_000;

function pickFormat(formats: readonly BannerFormat[], containerWidth: number): BannerFormat {
  return formats.find(f => f.width <= containerWidth) ?? formats[formats.length - 1];
}

function bannerDocument({ key, width, height }: BannerFormat): string {
  const options = JSON.stringify({ key, format: "iframe", height, width, params: {} });
  return `<!doctype html><html><head><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body><script data-cfasync="false">atOptions = ${options};</script><script data-cfasync="false" src="${BANNER_SCRIPT_BASE}/${key}"></script></body></html>`;
}

type BannerAdProps = {
  /** Widest first; the last entry is used when none fits. */
  formats?: readonly BannerFormat[];
  /**
   * Scale the creative up (aspect kept, max `MAX_FILL_SCALE`) to fill the container. The iframe is positioned
   * absolutely so it never sizes the container, so the parent must give it a height (e.g. `flex-1 min-h-*`).
   */
  fill?: boolean;
  /** Recorded in ad stats; grid cards and side rails pass their own kind. */
  unit?: AdUnitKind;
  className?: string;
};

type Layout = { format: BannerFormat; scale: number };

export default function BannerAd({ formats = BANNER_FORMATS, fill = false, unit = "banner", className = "" }: BannerAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const near = useNearViewport(containerRef);
  const { status } = useAdConsent();
  const shouldLoad = near && status === "granted";
  const { start, report } = useAdUnit(unit, containerRef);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const format = pickFormat(formats, el.clientWidth);
      const scale = fill
        ? Math.max(1, Math.min(el.clientWidth / format.width, el.clientHeight / format.height, MAX_FILL_SCALE))
        : 1;
      setLayout(prev =>
        prev?.format.key === format.key && Math.abs(prev.scale - scale) < 0.01 ? prev : { format, scale }
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [formats, fill]);

  const formatKey = layout?.format.key;

  // One request per rendered format: count the load, then watch the frame until an ad shows up or time runs out.
  useEffect(() => {
    if (!shouldLoad || !formatKey) return;
    start();
    const startedAt = Date.now();
    const poll = setInterval(() => {
      if (hasRenderedAd(iframeRef.current?.contentDocument)) {
        clearInterval(poll);
        report("filled");
      } else if (Date.now() - startedAt >= FILL_TIMEOUT_MS) {
        clearInterval(poll);
        report("unfilled");
      }
    }, FILL_POLL_MS);
    return () => clearInterval(poll);
  }, [shouldLoad, formatKey, start, report]);

  const fallbackHeight = formats[formats.length - 1].height;
  const iframe = layout && shouldLoad && (
    <iframe
      ref={iframeRef}
      key={layout.format.key}
      title="Advertisement"
      srcDoc={bannerDocument(layout.format)}
      width={layout.format.width}
      height={layout.format.height}
      scrolling="no"
      className={fill ? "block border-0" : "block max-w-full border-0"}
      style={fill ? { transform: `scale(${layout.scale})` } : undefined}
    />
  );

  if (fill) {
    return (
      <div
        ref={containerRef}
        className={`relative w-full overflow-hidden ${className}`}
        style={{ minHeight: fallbackHeight }}>
        <div className="absolute inset-0 flex items-center justify-center">{iframe}</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex w-full justify-center ${className}`}
      style={{ minHeight: layout?.format.height ?? fallbackHeight }}>
      {iframe}
    </div>
  );
}
