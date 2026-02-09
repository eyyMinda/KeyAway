"use client";

import { ReactNode } from "react";

interface ContactModalTriggerProps {
  tab: "contact" | "suggest";
  children: ReactNode;
  className?: string;
  asChild?: boolean;
}

export default function ContactModalTrigger({ tab, children, className, asChild }: ContactModalTriggerProps) {
  const handleClick = () => {
    const event = new CustomEvent("openContactModal", { detail: { tab } });
    window.dispatchEvent(event);
  };

  const triggerClassName = [className, "cursor-pointer"].filter(Boolean).join(" ");

  if (asChild) {
    return (
      <div onClick={handleClick} className={triggerClassName}>
        {children}
      </div>
    );
  }

  return (
    <button onClick={handleClick} className={triggerClassName} type="button">
      {children}
    </button>
  );
}
