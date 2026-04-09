"use client";

import { ReactNode } from "react";
import { trackInteraction } from "@/src/lib/analytics/trackInteraction";
import { InteractionId, SectionId } from "@/src/lib/analytics/interactionCatalog";

interface ContactModalTriggerProps {
  tab: "contact" | "suggest";
  children: ReactNode;
  className?: string;
  asChild?: boolean;
  interactionId?: InteractionId;
  sectionId?: SectionId;
  pagePath?: string;
  programSlug?: string;
}

export default function ContactModalTrigger({
  tab,
  children,
  className,
  asChild,
  interactionId,
  sectionId,
  pagePath,
  programSlug
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
