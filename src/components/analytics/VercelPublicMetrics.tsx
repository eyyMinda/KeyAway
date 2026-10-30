"use client";

import { Analytics } from "@vercel/analytics/next";
import {
  isVercelAnalyticsEnabled,
  isVercelProductionDeployment,
  shouldTrackPublicVercelMetrics
} from "@/src/lib/vercel/publicMetrics";

/**
 * Production-only Vercel Web Analytics with admin/studio/api exclusion.
 */
export default function VercelPublicMetrics() {
  if (!isVercelProductionDeployment() || !isVercelAnalyticsEnabled()) return null;

  return (
    <Analytics
      mode="production"
      beforeSend={event => {
        if (!shouldTrackPublicVercelMetrics(event.url)) return null;
        return event;
      }}
    />
  );
}
