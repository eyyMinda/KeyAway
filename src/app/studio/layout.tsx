import type { ReactNode } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { NextStudioLayout, metadata, viewport } from "next-sanity/studio";

export { metadata, viewport };

/** Studio shell from next-sanity; page under `[[...tool]]` is a client boundary (avoids SSR `window` access). */
export default function StudioLayout({ children }: { children: ReactNode }) {
  noStore();
  return <NextStudioLayout>{children}</NextStudioLayout>;
}
