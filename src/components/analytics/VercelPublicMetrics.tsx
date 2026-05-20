"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  isVercelProductionDeployment,
  resolveSpeedInsightsSampleRate,
  shouldTrackPublicVercelMetrics
} from "@/src/lib/vercel/publicMetrics";

/**
 * Production-only Vercel RUM with downsampling and admin/studio/api exclusion.
 * Replaces bare <Analytics /> + <SpeedInsights /> in the root layout.
 */
export default function VercelPublicMetrics() {
  if (!isVercelProductionDeployment()) return null;

  const sampleRate = resolveSpeedInsightsSampleRate();

  return (
    <>
      <Analytics
        mode="production"
        beforeSend={event => {
          if (!shouldTrackPublicVercelMetrics(event.url)) return null;
          return event;
        }}
      />
      <SpeedInsights
        sampleRate={sampleRate}
        beforeSend={event => {
          if (!shouldTrackPublicVercelMetrics(event.url)) return null;
          return event;
        }}
      />
    </>
  );
}
