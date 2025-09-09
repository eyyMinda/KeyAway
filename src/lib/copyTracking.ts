import { trackEvent } from "./trackEvent";
import { CDKey } from "@/src/types/ProgramType";

export function trackCopyEvent(cdKey: CDKey, slug: string, copyMethod: "button_click" | "keyboard_or_context_menu") {
  trackEvent("copy_cdkey", {
    programSlug: slug,
    key: cdKey,
    path: window.location.pathname,
    copyMethod
  });
}
