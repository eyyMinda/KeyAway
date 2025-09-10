"use client";

import { useState, useEffect, useCallback } from "react";
import { client } from "@/src/sanity/lib/client";
import { trackingEventsQuery } from "@/src/lib/queries";
import { hashCDKeyClient, getKeyIdentifier, normalizeKey } from "@/src/lib/keyHashing";
import { logger } from "@/src/lib/logger";

export function useExpiredKeyReports(programSlug: string, currentCdKeys?: Array<{ key: string }>) {
  const [reports, setReports] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
        const events = await client.fetch(trackingEventsQuery, { since });

        const expiredReports = events.filter((event: Record<string, unknown>) => {
          const isExpired = event.event === "report_expired_cdkey";
          const matchesProgram = event.programSlug === programSlug;
          return isExpired && matchesProgram;
        });

        const keyReports = new Map<string, number>();
        for (const report of expiredReports) {
          const keyHash = (report.keyHash as string) || "unknown";
          keyReports.set(keyHash, (keyReports.get(keyHash) || 0) + 1);
        }

        setReports(keyReports);

        // Compare event hashes with current CD keys if provided
        if (currentCdKeys && currentCdKeys.length > 0) {
          // Generate hashes for current CD keys
          const currentKeyHashes = new Map<
            string,
            { key: string; hash: string; identifier: string; normalized: string }
          >();

          for (const cdKey of currentCdKeys) {
            const hash = await hashCDKeyClient(cdKey.key);
            const identifier = getKeyIdentifier(cdKey.key);
            const normalized = normalizeKey(cdKey.key);
            currentKeyHashes.set(hash, { key: cdKey.key, hash, identifier, normalized });
          }

          // Convert current keys to array of objects for collapsible logging
          const currentKeysArray = Array.from(currentKeyHashes.values()).map(data => ({
            key: data.key,
            hash: data.hash,
            identifier: data.identifier,
            normalized: data.normalized
          }));

          logger.table(currentKeysArray, `Current Program CD Keys (${programSlug})`, "info");

          // Convert tracking events to array of objects for collapsible logging
          const eventsArray = expiredReports.map((report: Record<string, unknown>) => {
            const eventHash = report.keyHash as string;
            const eventIdentifier = report.keyIdentifier as string;
            const eventNormalized = report.keyNormalized as string;
            const isMatch = currentKeyHashes.has(eventHash);
            const matchedKey = isMatch ? currentKeyHashes.get(eventHash)?.key : null;

            return {
              eventHash,
              eventIdentifier,
              eventNormalized,
              isMatch: isMatch ? "✅" : "❌",
              matchedKey,
              createdAt: report.createdAt,
              programSlug: report.programSlug
            };
          });

          logger.table(eventsArray, `Tracking Events for ${programSlug}`, "info");

          // Convert report counts to array of objects for collapsible logging
          const reportCountsArray = Array.from(keyReports.entries()).map(([hash, count]) => {
            const isCurrentKey = currentKeyHashes.has(hash);
            const matchedKey = isCurrentKey ? currentKeyHashes.get(hash)?.key : null;

            return {
              hash,
              count,
              isCurrentKey: isCurrentKey ? "✅" : "❌",
              matchedKey
            };
          });

          logger.table(reportCountsArray, `Report Counts by Hash (${programSlug})`, "warning");
        }
      } catch (error) {
        logger.collapse(error, "Error fetching expired key reports", "error");
      } finally {
        setLoading(false);
      }
    };

    if (programSlug) {
      fetchReports();
    }
  }, [programSlug, currentCdKeys]);

  const getReportCount = useCallback(
    async (cdKey: string): Promise<number> => {
      const keyHash = await hashCDKeyClient(cdKey);
      return reports.get(keyHash) || 0;
    },
    [reports]
  );

  return { reports, loading, getReportCount };
}
