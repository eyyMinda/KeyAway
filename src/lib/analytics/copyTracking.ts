import { trackEvent } from "./trackEvent";
import { CDKey } from "@/src/types";
import type { ProgramFlow } from "@/src/types/program";
import { isAccountFlow, isKeyLikeFlow, isLinkAccountFlow } from "@/src/lib/program/activationEntry";
import type { AnalyticsEvent } from "@/src/types/tracking";

function copyEventForFlow(flow: ProgramFlow): AnalyticsEvent | null {
  if (isKeyLikeFlow(flow)) return "copy_cdkey";
  if (isAccountFlow(flow)) return "copy_pro_account";
  if (isLinkAccountFlow(flow)) return null;
  return "copy_cdkey";
}

export function trackCopyEvent(
  cdKey: CDKey,
  slug: string,
  copyMethod: "button_click" | "keyboard_or_context_menu",
  programFlow: ProgramFlow
) {
  const event = copyEventForFlow(programFlow);
  if (!event) return;
  trackEvent(event, {
    programSlug: slug,
    key: cdKey,
    programFlow,
    path: window.location.pathname,
    copyMethod
  });
}
