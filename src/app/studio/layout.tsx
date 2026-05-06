import type { ReactNode } from "react";
import { NextStudioLayout, metadata, viewport } from "next-sanity/studio";

export { metadata, viewport };

/** Studio shell from next-sanity; page under `[[...tool]]` is a client boundary (avoids SSR `window` access). */
export default function StudioLayout({ children }: { children: ReactNode }) {
  return <NextStudioLayout>{children}</NextStudioLayout>;
}
