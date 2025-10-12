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

  if (asChild) {
    // Clone the child element and add the onClick handler
    return (
      <div onClick={handleClick} className={className}>
        {children}
      </div>
    );
  }

  return (
    <button onClick={handleClick} className={className} type="button">
      {children}
    </button>
  );
}
