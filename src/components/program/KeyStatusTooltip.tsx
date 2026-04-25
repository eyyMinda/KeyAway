"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ToggleEventHandler } from "react";
import { FaInfoCircle } from "react-icons/fa";

/** Prefer at least this much space below or above before choosing that side (matches prior behavior). */
const MIN_VIEWPORT_EDGE = 200;

export default function KeyStatusTooltip() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"top" | "bottom">("bottom");

  const updatePlacement = useCallback(() => {
    const details = detailsRef.current;
    const panel = panelRef.current;
    const summary = details?.querySelector("summary");
    if (!details?.open || !panel || !summary) return;

    const sr = summary.getBoundingClientRect();
    const panelH = Math.max(panel.scrollHeight, 1);
    const spaceBelow = window.innerHeight - sr.bottom;
    const spaceAbove = sr.top;

    const enoughBelow = spaceBelow >= Math.min(panelH, MIN_VIEWPORT_EDGE);
    const enoughAbove = spaceAbove >= Math.min(panelH, MIN_VIEWPORT_EDGE);

    if (enoughBelow && (spaceBelow >= spaceAbove || !enoughAbove)) {
      setPlacement("bottom");
    } else if (enoughAbove) {
      setPlacement("top");
    } else {
      setPlacement(spaceBelow >= spaceAbove ? "bottom" : "top");
    }
  }, []);

  const onToggle: ToggleEventHandler<HTMLDetailsElement> = e => {
    const next = e.currentTarget.open;
    setOpen(next);
    if (!next) {
      setPlacement("bottom");
    } else {
      requestAnimationFrame(() => {
        updatePlacement();
        requestAnimationFrame(() => updatePlacement());
      });
    }
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePlacement();
  }, [open, updatePlacement]);

  useEffect(() => {
    if (!open) return;
    const onViewportChange = () => updatePlacement();
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [open, updatePlacement]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const d = detailsRef.current;
      if (d && !d.contains(e.target as Node)) {
        d.open = false;
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  const panelPosition = placement === "bottom" ? "top-full mt-2" : "bottom-full mb-2";

  const caret =
    placement === "bottom" ? (
      <div
        className="absolute right-4 top-0 h-0 w-0 -translate-y-full border-x-[6px] border-b-8 border-x-transparent border-b-gray-900"
        aria-hidden
      />
    ) : (
      <div
        className="absolute right-4 bottom-0 h-0 w-0 translate-y-full border-x-[6px] border-t-8 border-x-transparent border-t-gray-900"
        aria-hidden
      />
    );

  return (
    <details ref={detailsRef} className="relative shrink-0" onToggle={onToggle}>
      <summary className="flex cursor-pointer list-none items-center justify-center rounded p-2 text-neutral-400 transition-colors hover:text-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="sr-only">Key status guide</span>
        <FaInfoCircle className="h-5 w-5 shrink-0" aria-hidden />
      </summary>

      {open ? (
        <div
          ref={panelRef}
          data-key-status-panel
          className={`absolute right-0 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-gray-600 bg-gray-900 px-4 py-3 text-sm text-white shadow-lg transition-all duration-200 ease-out ${panelPosition}`}
          style={{
            animation: `${placement === "bottom" ? "slideDown" : "slideUp"} 0.2s ease-out`
          }}>
          {caret}
          <div className="space-y-2">
            <p className="mb-2 font-semibold text-white">Key Status Guide:</p>
            <div className="flex items-center space-x-2">
              <span className="h-3 w-3 shrink-0 rounded-full bg-primary-500" />
              <span>
                <strong>New:</strong> Fresh, unused keys
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-3 w-3 shrink-0 rounded-full bg-success-500" />
              <span>
                <strong>Active:</strong> Working and available
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-3 w-3 shrink-0 rounded-full bg-warning-500" />
              <span>
                <strong>Limit:</strong> Usage limit reached
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-3 w-3 shrink-0 rounded-full bg-error-500" />
              <span>
                <strong>Expired:</strong> Past validity date
              </span>
            </div>
            <p className="mt-3 border-t border-gray-600 pt-2 text-xs text-neutral-300">
              Keys automatically expire based on their validity dates. Report non-working keys to help improve the
              system.
            </p>
          </div>
        </div>
      ) : null}
    </details>
  );
}
