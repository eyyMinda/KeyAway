import { useEffect } from "react";
import { trackCopyEvent } from "@/src/lib/copyTracking";
import { CDKey } from "@/src/types/ProgramType";

interface UseCopyTrackingProps {
  cdKey: CDKey;
  slug: string;
}

export function useCopyTracking({ cdKey, slug }: UseCopyTrackingProps) {
  useEffect(() => {
    const handleCopy = async () => {
      // Wait for clipboard to be updated
      setTimeout(async () => {
        try {
          const copiedText = await navigator.clipboard.readText();
          if (copiedText === cdKey.key) {
            trackCopyEvent(cdKey, slug, "keyboard_or_context_menu");
          }
        } catch (error) {
          // Silently handle clipboard access errors
        }
      }, 10);
    };

    document.addEventListener("copy", handleCopy);
    return () => document.removeEventListener("copy", handleCopy);
  }, [cdKey, slug]);
}
