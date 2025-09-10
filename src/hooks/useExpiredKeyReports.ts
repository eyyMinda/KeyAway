"use client";

import { useState, useEffect } from "react";
import { client } from "@/src/sanity/lib/client";
import { trackingEventsQuery } from "@/src/lib/queries";

export function useExpiredKeyReports(programSlug: string) {
  const [reports, setReports] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        // Fetch expired key reports from last 30 days
        const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
        const events = await client.fetch(trackingEventsQuery, { since });

        // Filter for expired key reports for this program
        const expiredReports = events.filter(
          (event: Record<string, unknown>) =>
            event.event === "report_expired_cdkey" && event.programSlug === programSlug
        );

        // Group by key and count reports
        const keyReports = new Map<string, number>();

        for (const report of expiredReports) {
          const key = (report.keyMasked as string) || "unknown";
          keyReports.set(key, (keyReports.get(key) || 0) + 1);
        }

        setReports(keyReports);
      } catch (error) {
        console.error("Error fetching expired key reports:", error);
      } finally {
        setLoading(false);
      }
    };

    if (programSlug) {
      fetchReports();
    }
  }, [programSlug]);

  return { reports, loading };
}
