import { KeyReport } from "@/src/types/admin";
import { CDKey, CDKeyStatus, Program } from "@/src/types/program";
import { getKeyData } from "@/src/lib/keyHashing";
import { normalizeProgramFlow } from "@/src/lib/program/activationEntry";

export const STATUS_OPTIONS: Record<CDKeyStatus, string> = {
  new: "New",
  active: "Active",
  expired: "Expired",
  limit: "Limit Reached"
};

/**
 * Creates a report key for tracking changes (stable per activation row)
 */
export const createReportKey = (report: KeyReport): string => {
  return `${report.programSlug}:${report.storageKey}`;
};

/**
 * Finds a program by slug in an array of programs
 */
export const findProgramBySlug = (programs: Program[], programSlug: string): Program | undefined => {
  return programs.find(p => p.slug?.current === programSlug);
};

/**
 * Finds an activation row index in a program's cdKeys array by storage key (matches keyReport `key`).
 */
export const findKeyIndexByStorageKey = (program: Program, storageKey: string): number => {
  const flow = normalizeProgramFlow(program.programFlow);
  return (
    program.cdKeys?.findIndex((k: CDKey) => {
      const kd = getKeyData({ ...k, programFlow: flow }, flow);
      return kd?.hash === storageKey;
    }) ?? -1
  );
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
