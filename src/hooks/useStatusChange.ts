import { useState, useCallback } from "react";
import { CDKey, CDKeyStatus, Program } from "@/src/types/program";
import { KeyReport } from "@/src/types/admin";
import {
  createReportKey,
  findProgramBySlug,
  findKeyIndexByStorageKey,
  removeFromPendingChanges,
  removeFromSaving,
  addToSaving
} from "@/src/lib/admin/adminUtils";

interface UseStatusChangeProps {
  programs: Program[];
  setReports: React.Dispatch<React.SetStateAction<KeyReport[]>>;
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
}

export function useStatusChange({ programs, setReports, setPrograms }: UseStatusChangeProps) {
  const [pendingChanges, setPendingChanges] = useState<
    Map<string, { originalStatus: CDKeyStatus; newStatus: CDKeyStatus }>
  >(new Map());
  const [saving, setSaving] = useState<Set<string>>(new Set());

  const handleStatusChange = useCallback((report: KeyReport, newStatus: CDKeyStatus) => {
    const reportKey = createReportKey(report);

    console.log("Status change:", {
      reportKey,
      currentStatus: report.status,
      newStatus,
      newStatusType: typeof newStatus
    });

    if (newStatus === report.status) {
      // If status is same as original, remove from pending changes
      setPendingChanges(prev => removeFromPendingChanges(prev, reportKey));
    } else {
      // Add or update pending change
      setPendingChanges(prev => {
        const newMap = new Map(prev);
        newMap.set(reportKey, {
          originalStatus: report.status,
          newStatus
        });
        return newMap;
      });
    }
  }, []);

  const saveStatusChange = useCallback(
    async (report: KeyReport) => {
      const reportKey = createReportKey(report);
      const change = pendingChanges.get(reportKey);

      if (!change) {
        console.warn("No pending change found for report:", report);
        return;
      }

      setSaving(prev => addToSaving(prev, reportKey));

      try {
        // Find the program that contains this key
        const program = findProgramBySlug(programs, report.programSlug);

        if (!program) {
          console.error("Program not found:", report.programSlug);
          console.error(
            "Available programs:",
            programs.map(p => p.slug?.current)
          );
          return;
        }

        const keyIndex = findKeyIndexByStorageKey(program, report.storageKey);

        if (keyIndex === undefined || keyIndex === -1) {
          console.error("Activation row not found in program (storageKey):", report.storageKey);
          return;
        }

        console.log("Updating key:", {
          programSlug: program.slug?.current,
          keyIndex,
          oldStatus: program.cdKeys?.[keyIndex]?.status,
          newStatus: change.newStatus,
          newStatusType: typeof change.newStatus
        });

        // Validate the status value before sending to Sanity
        const validStatuses = ["new", "active", "expired", "limit"];
        if (!validStatuses.includes(change.newStatus)) {
          console.error("Invalid status value:", change.newStatus);
          console.error("Valid statuses:", validStatuses);
          return;
        }

        // Update the key status via API route
        const response = await fetch("/api/v1/admin/key-reports", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            programSlug: program.slug?.current,
            keyIndex,
            newStatus: change.newStatus
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API Error:", errorData);
          throw new Error(errorData?.error?.message ?? errorData?.error ?? "Failed to update key status");
        }

        const result = await response.json();
        console.log("Update result:", result);

        // Update local reports state
        setReports(prev =>
          prev.map(r =>
            r.programSlug === report.programSlug && r.storageKey === report.storageKey
              ? { ...r, status: change.newStatus }
              : r
          )
        );

        // Update local programs state
        setPrograms(prev =>
          prev.map(p =>
            p.slug?.current === program.slug?.current
              ? {
                  ...p,
                  cdKeys: p.cdKeys?.map((k: CDKey, index: number) =>
                    index === keyIndex ? { ...k, status: change.newStatus } : k
                  )
                }
              : p
          )
        );

        // Remove from pending changes
        setPendingChanges(prev => {
          const newMap = new Map(prev);
          newMap.delete(reportKey);
          return newMap;
        });

        console.log("Successfully updated key status");
      } catch (error) {
        console.error("Error updating key status:", error);
      } finally {
        setSaving(prev => removeFromSaving(prev, reportKey));
      }
    },
    [pendingChanges, programs, setReports, setPrograms]
  );

  const cancelStatusChange = useCallback((report: KeyReport) => {
    const reportKey = createReportKey(report);
    setPendingChanges(prev => removeFromPendingChanges(prev, reportKey));
  }, []);

  return {
    pendingChanges,
    saving,
    handleStatusChange,
    saveStatusChange,
    cancelStatusChange
  };
}
