"use client";

import { useState, useEffect, useCallback } from "react";
import { sanityPublicReadClient } from "@/src/sanity/lib/publicReadClient";
import { keyReportsQuery } from "@/src/lib/sanity/queries";
import { ReportData } from "@/src/types/program";
import { logger } from "@/src/lib/logger";

type KeyReportFetched = {
  eventType?: string;
  programSlug?: string;
  key?: string;
};

/** `rowStorageIds[i]` aligns with `cdKeys[i]` (plaintext key, username, or link digest — same as server `getRowStorageHash`). */
export function useKeyReportData(programSlug: string, rowStorageIds: string[]) {
  const [reportData, setReportData] = useState<Map<string, ReportData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const since = "1970-01-01T00:00:00.000Z";
        const events = await sanityPublicReadClient.fetch<KeyReportFetched[]>(keyReportsQuery, { since });

        const keyReportEvents = events.filter(e => e.programSlug === programSlug);

        const keyReportData = new Map<string, ReportData>();

        for (const id of rowStorageIds) {
          if (!id) continue;
          keyReportData.set(id, { working: 0, expired: 0, limit_reached: 0 });
        }

        for (const event of keyReportEvents) {
          const storageKey = String(event.key ?? "").trim();
          if (!storageKey) continue;
          const eventType = event.eventType as string;

          if (!keyReportData.has(storageKey)) {
            keyReportData.set(storageKey, { working: 0, expired: 0, limit_reached: 0 });
          }

          const currentData = keyReportData.get(storageKey)!;

          switch (eventType) {
            case "report_key_working":
              keyReportData.set(storageKey, { ...currentData, working: currentData.working + 1 });
              break;
            case "report_key_expired":
              keyReportData.set(storageKey, { ...currentData, expired: currentData.expired + 1 });
              break;
            case "report_key_limit_reached":
              keyReportData.set(storageKey, { ...currentData, limit_reached: currentData.limit_reached + 1 });
              break;
          }
        }

        setReportData(keyReportData);
      } catch (error) {
        logger.collapse(error, "Error fetching key report data", "error");
      } finally {
        setLoading(false);
      }
    };

    void fetchReportData();
  }, [programSlug, rowStorageIds, refreshTrigger]);

  const refreshReportData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return { reportData, loading, refreshReportData };
}
