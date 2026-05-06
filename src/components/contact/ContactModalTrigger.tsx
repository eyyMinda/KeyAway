"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Dispatches `openContactModal` so Header-owned `ContactModal` opens on the requested tab. */
export type ContactModalTriggerProps = {
  tab: "contact" | "suggest";
  children: ReactNode;
  className?: string;
  asChild?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type">;

export default function ContactModalTrigger({
  tab,
  children,
  className,
  asChild,
  ...rest
}: ContactModalTriggerProps) {
  const handleClick = () => {
    const event = new CustomEvent("openContactModal", { detail: { tab } });
    window.dispatchEvent(event);
  };

  const triggerClassName = [className, "cursor-pointer"].filter(Boolean).join(" ");

  if (asChild) {
    return (
      <div onClick={handleClick} className={triggerClassName} role="button" tabIndex={0}>
        {children}
      </div>
    );
  }

  return (
    <button type="button" onClick={handleClick} className={triggerClassName} {...rest}>
      {children}
    </button>
  );
}
