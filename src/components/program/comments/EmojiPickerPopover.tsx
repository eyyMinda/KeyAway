"use client";

import dynamic from "next/dynamic";
import { Theme } from "emoji-picker-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

const PICKER_WIDTH = 320;
const PICKER_HEIGHT = 360;
const GAP = 8;

type EmojiPickerPopoverProps = {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  onSelect: (emoji: string) => void;
};

export default function EmojiPickerPopover({ open, onClose, anchorRef, onSelect }: EmojiPickerPopoverProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let left = rect.left;
    let top = rect.bottom + GAP;

    if (left + PICKER_WIDTH > viewportW - GAP) {
      left = Math.max(GAP, viewportW - PICKER_WIDTH - GAP);
    }

    if (top + PICKER_HEIGHT > viewportH - GAP) {
      top = rect.top - PICKER_HEIGHT - GAP;
    }
    if (top < GAP) top = GAP;

    setPosition({ top, left });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const onScrollOrResize = () => updatePosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);

    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (pickerRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !position || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={pickerRef}
      className="fixed z-9999 overflow-hidden rounded-sm border border-[#2a475e] shadow-2xl"
      style={{ top: position.top, left: position.left, width: PICKER_WIDTH }}
      role="dialog"
      aria-label="Emoji picker">
      <EmojiPicker
        onEmojiClick={({ emoji }) => {
          onSelect(emoji);
        }}
        theme={Theme.DARK}
        width={PICKER_WIDTH}
        height={PICKER_HEIGHT}
        previewConfig={{ showPreview: false }}
        skinTonesDisabled
        searchPlaceholder="Search emoji…"
      />
    </div>,
    document.body
  );
}
