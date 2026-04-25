"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { trackInteraction } from "@/src/lib/analytics/trackInteraction";
import { InteractionId, SectionId } from "@/src/lib/analytics/interactionCatalog";

export type ContactModalTriggerProps = {
  tab: "contact" | "suggest";
  children: ReactNode;
  className?: string;
  asChild?: boolean;
  interactionId?: InteractionId;
  sectionId?: SectionId;
  pagePath?: string;
  programSlug?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type">;

export default function ContactModalTrigger({
  tab,
  children,
  className,
  asChild,
  interactionId,
  sectionId,
  pagePath,
  programSlug,
  ...rest
}: ContactModalTriggerProps) {
  const handleClick = () => {
    if (interactionId && sectionId) {
      void trackInteraction({ interactionId, sectionId, pagePath, programSlug });
    }
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
