"use client";

import { NextStudio } from "next-sanity/studio/client-component";
import config from "@/sanity.config";

/** Loads only after `page.tsx` dynamic import — keeps `sanity.config` off the SSR graph. */
export default function StudioEmbedded() {
  return <NextStudio config={config} />;
}
