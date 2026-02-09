"use client";

import { useState, useEffect, useCallback } from "react";
import { client } from "@/src/sanity/lib/client";
import { keyReportsQuery } from "@/src/lib/queries";
import { hashCDKeyClient } from "@/src/lib/keyHashing";
import { ReportData } from "@/src/types/program";
import { logger } from "@/src/lib/logger";

export function useKeyReportData(programSlug: string, currentCdKeys?: Array<{ key: string }>) {
  const [reportData, setReportData] = useState<Map<string, ReportData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        // const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
        const since = "1970-01-01T00:00:00.000Z"; // all historical reports
        const events = await client.fetch(keyReportsQuery, { since });

        // Filter for matching program
        const keyReportEvents = events.filter((event: Record<string, unknown>) => {
          const matchesProgram = event.programSlug === programSlug;
          return matchesProgram;
        });

        const keyReportData = new Map<string, ReportData>();

        // Initialize with current keys
        if (currentCdKeys) {
          for (const cdKey of currentCdKeys) {
            const keyHash = await hashCDKeyClient(cdKey.key);
            keyReportData.set(keyHash, { working: 0, expired: 0, limit_reached: 0 });
          }
        }

        // Process events
        for (const event of keyReportEvents) {
          const keyHash = (event.keyHash as string) || "unknown";
          const eventType = event.eventType as string;

          if (!keyReportData.has(keyHash)) {
            keyReportData.set(keyHash, { working: 0, expired: 0, limit_reached: 0 });
          }

          const currentData = keyReportData.get(keyHash)!;

          switch (eventType) {
            case "report_key_working":
              keyReportData.set(keyHash, { ...currentData, working: currentData.working + 1 });
              break;
            case "report_key_expired":
              keyReportData.set(keyHash, { ...currentData, expired: currentData.expired + 1 });
              break;
            case "report_key_limit_reached":
              keyReportData.set(keyHash, { ...currentData, limit_reached: currentData.limit_reached + 1 });
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

    fetchReportData();
  }, [programSlug, currentCdKeys, refreshTrigger]);

  const getReportData = useCallback(
    async (key: string): Promise<ReportData> => {
      const keyHash = await hashCDKeyClient(key);
      return reportData.get(keyHash) || { working: 0, expired: 0, limit_reached: 0 };
    },
    [reportData]
  );

  const refreshReportData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return { getReportData, loading, refreshReportData };
}
