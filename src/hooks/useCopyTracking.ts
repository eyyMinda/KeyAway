import { useEffect } from "react";
import { trackCopyEvent } from "@/src/lib/analytics/copyTracking";
import { UseCopyTrackingProps } from "@/src/types";

export function useCopyTracking({ cdKey, slug, programFlow, clipboardMatch }: UseCopyTrackingProps) {
  useEffect(() => {
    if (!clipboardMatch) return;

    const handleCopy = async () => {
      setTimeout(async () => {
        try {
          const copiedText = await navigator.clipboard.readText();
          const norm = (s: string) => s.replace(/\r\n/g, "\n").trim();
          if (norm(copiedText) === norm(clipboardMatch)) {
            trackCopyEvent(cdKey, slug, "keyboard_or_context_menu", programFlow);
          }
        } catch {
          // Silently handle clipboard access errors
        }
      }, 10);
    };

    document.addEventListener("copy", handleCopy);
    return () => document.removeEventListener("copy", handleCopy);
  }, [cdKey, slug, programFlow, clipboardMatch]);
}
