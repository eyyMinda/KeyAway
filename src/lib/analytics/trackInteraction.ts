import { TrackInteractionBody } from "@/src/types";
import { InteractionId, SectionId } from "@/src/lib/analytics/interactionCatalog";

type TrackInteractionInput = Omit<TrackInteractionBody, "pagePath" | "interactionId" | "sectionId"> & {
  interactionId: InteractionId;
  sectionId: SectionId;
  pagePath?: string;
};

function resolvePath(path?: string): string {
  const raw = path?.trim() || (typeof window !== "undefined" ? window.location.pathname : "/");
  if (!raw.startsWith("/")) return `/${raw}`;
  return raw;
}

export async function trackInteraction(input: TrackInteractionInput) {
  try {
    await fetch("/api/v1/interactions/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interactionId: input.interactionId,
        sectionId: input.sectionId,
        pagePath: resolvePath(input.pagePath),
        programSlug: input.programSlug
      } satisfies TrackInteractionBody),
      keepalive: true
    });
  } catch (e) {
    void e;
  }
}
