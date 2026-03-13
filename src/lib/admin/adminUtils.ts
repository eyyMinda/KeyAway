import { ExpiredKeyReport } from "@/src/types/admin";
import { CDKeyStatus, Program } from "@/src/types/program";

export const STATUS_OPTIONS: Record<CDKeyStatus, string> = {
  new: "New",
  active: "Active",
  expired: "Expired",
  limit: "Limit Reached"
};

/**
 * Creates a report key for tracking changes
 */
export const createReportKey = (report: ExpiredKeyReport): string => {
  return `${report.programSlug}:${report.key}`;
};

/**
 * Finds a program by slug in an array of programs
 */
export const findProgramBySlug = (programs: Program[], programSlug: string): Program | undefined => {
  return programs.find(p => p.slug?.current === programSlug);
};

/**
 * Finds a CD key index in a program's cdKeys array
 */
export const findKeyIndex = (program: Program, key: string): number => {
  return program.cdKeys?.findIndex(k => k.key === key) ?? -1;
};

/**
 * Removes a report from pending changes
 */
export const removeFromPendingChanges = (
  pendingChanges: Map<string, { originalStatus: CDKeyStatus; newStatus: CDKeyStatus }>,
  reportKey: string
): Map<string, { originalStatus: CDKeyStatus; newStatus: CDKeyStatus }> => {
  const newMap = new Map(pendingChanges);
  newMap.delete(reportKey);
  return newMap;
};

/**
 * Removes a report from saving set
 */
export const removeFromSaving = (saving: Set<string>, reportKey: string): Set<string> => {
  const newSet = new Set(saving);
  newSet.delete(reportKey);
  return newSet;
};

/**
 * Adds a report to saving set
 */
export const addToSaving = (saving: Set<string>, reportKey: string): Set<string> => {
  return new Set(saving).add(reportKey);
};
