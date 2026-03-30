"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

const baseClass =
  "inline-flex shrink-0 items-center justify-center rounded transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-current/40";

export type ModalCloseButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  /** Classes on the default X icon (`h-* w-*`). Ignored when `children` is set. */
  iconClassName?: string;
  /**
   * Text (or other content) instead of the X. When omitted, renders the default close icon.
   * Visible label supplies the accessible name; override with `aria-label` if needed.
   */
  children?: ReactNode;
};

/**
 * Dismiss control for modals / popups: default X icon, or pass `children` for a text/label button.
 */
export function ModalCloseButton({
  className = "",
  iconClassName = "h-6 w-6",
  children,
  "aria-label": ariaLabel,
  ...rest
}: ModalCloseButtonProps) {
  const iconOnly = children == null;
  const a11yLabel = ariaLabel ?? (iconOnly ? "Close" : undefined);

  return (
    <button
      type="button"
      {...(a11yLabel != null && a11yLabel !== "" ? { "aria-label": a11yLabel } : {})}
      className={`${baseClass} ${className}`.trim()}
      {...rest}>
      {iconOnly ? (
        <svg className={iconClassName} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        children
      )}
    </button>
  );
}
