"use client";

import { useState, useEffect, useCallback } from "react";
import { sanityPublicReadClient } from "@/src/sanity/lib/publicReadClient";
import { programPageKeyReportsQuery } from "@/src/lib/sanity/queries";
import { ReportData } from "@/src/types/program";
import { logger } from "@/src/lib/logger";
import { applyKeyReportEvent, emptyReportData } from "@/src/lib/program/keyReportVersionFit";

type KeyReportFetched = {
  eventType?: string;
  key?: string;
  triedVersionFit?: string | null;
  triedVersion?: string | null;
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
        const events = await sanityPublicReadClient.fetch<KeyReportFetched[]>(programPageKeyReportsQuery, {
          programSlug
        });

        const keyReportData = new Map<string, ReportData>();

        for (const id of rowStorageIds) {
          if (!id) continue;
          keyReportData.set(id, emptyReportData());
        }

        for (const event of events ?? []) {
          const storageKey = String(event.key ?? "").trim();
          if (!storageKey) continue;
          const eventType = event.eventType as string;

          if (!keyReportData.has(storageKey)) {
            keyReportData.set(storageKey, emptyReportData());
          }

          const currentData = keyReportData.get(storageKey)!;
          keyReportData.set(
            storageKey,
            applyKeyReportEvent(currentData, eventType, event.triedVersionFit, event.triedVersion)
          );
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
