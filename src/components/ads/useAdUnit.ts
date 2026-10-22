"use client";

/**
 * @fileoverview Shared behaviour of one ad unit inside an `AdFrame`: reports fill status to the frame and records
 * stats under the frame's placement. A view is a filled ad at least half on screen for 1 s. Clicks are estimated,
 * since ads are cross-origin frames: focus moving into an ad frame under the pointer, or a click on a link in it.
 */
import { useCallback, useContext, useEffect, useId, useState, type RefObject } from "react";
import { recordAdMetric } from "@/src/lib/ads/adTracker";
import type { AdUnitKind } from "@/src/lib/ads/adPlacements";
import { AdFrameContext, type AdFillStatus } from "./AdFrame";

const VIEW_DWELL_MS = 1_000;
const CLICK_DEBOUNCE_MS = 1_500;

export function useAdUnit(kind: AdUnitKind, ref: RefObject<HTMLElement | null>) {
  const frame = useContext(AdFrameContext);
  const unitId = useId();
  const [status, setStatus] = useState<AdFillStatus>("loading");
  const placement = frame?.placement;
  const setUnitStatus = frame?.setUnitStatus;

  /** Call when the unit starts requesting an ad. */
  const start = useCallback(() => {
    setStatus("loading");
    if (placement) recordAdMetric(placement, kind, "loads");
  }, [placement, kind]);

  const report = useCallback((next: "filled" | "unfilled") => setStatus(next), []);

  useEffect(() => {
    setUnitStatus?.(unitId, status);
    if (status === "filled" && placement) recordAdMetric(placement, kind, "fills");
  }, [status, unitId, setUnitStatus, placement, kind]);

  useEffect(() => () => setUnitStatus?.(unitId, null), [unitId, setUnitStatus]);

  useEffect(() => {
    const el = ref.current;
    if (status !== "filled" || !placement || !el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(timer);
        if (!entry?.isIntersecting || entry.intersectionRatio < 0.5) return;
        timer = setTimeout(() => {
          recordAdMetric(placement, kind, "views");
          observer.disconnect();
        }, VIEW_DWELL_MS);
      },
      { threshold: [0, 0.5] }
    );
    observer.observe(el);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [status, placement, kind, ref]);

  useEffect(() => {
    const el = ref.current;
    if (status !== "filled" || !placement || !el) return;
    let hovering = false;
    let lastClick = 0;
    const hit = () => {
      const now = Date.now();
      if (now - lastClick < CLICK_DEBOUNCE_MS) return;
      lastClick = now;
      recordAdMetric(placement, kind, "clicks");
    };
    const onEnter = () => (hovering = true);
    const onLeave = () => (hovering = false);
    const onWindowBlur = () =>
      setTimeout(() => {
        const active = document.activeElement;
        if (hovering && active instanceof HTMLIFrameElement && el.contains(active)) hit();
      }, 0);
    const onClick = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest("a")) hit();
    };
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("click", onClick, true);
    window.addEventListener("blur", onWindowBlur);
    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("click", onClick, true);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [status, placement, kind, ref]);

  return { status, start, report };
}

/** True once `root` contains something an ad script rendered (a frame, image, link or media with real size). */
export function hasRenderedAd(root: ParentNode | null | undefined): boolean {
  if (!root) return false;
  return Array.from(root.querySelectorAll<HTMLElement>("iframe, img, a, video, canvas")).some(
    el => el.offsetWidth > 10 && el.offsetHeight > 10
  );
}
