import { trackEvent } from "./trackEvent";
import type { CDKey } from "@/src/types/program";
import type { ProgramFlow } from "@/src/types/program";

/** Fires when user opens or invokes a giveaway link (left/right/middle). */
export function trackActivationLinkClick(
  cdKey: CDKey,
  slug: string,
  programFlow: ProgramFlow,
  activationUrl: string,
  clickButton: "left" | "right" | "aux" = "left"
) {
  trackEvent("click_activation_link", {
    programSlug: slug,
    key: { ...cdKey, programFlow },
    programFlow,
    activationUrl,
    path: typeof window !== "undefined" ? window.location.pathname : undefined,
    clickButton
  });
}
