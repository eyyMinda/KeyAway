import { KeyReportEvent, CDKey } from "@/src/types";

// CD Key Status Types
export type CDKeyStatus = "working" | "expired" | "limit_reached";

// Event Type Mappings
export const EVENT_TYPE_MAP: Record<CDKeyStatus, KeyReportEvent> = {
  working: "report_key_working",
  expired: "report_key_expired",
  limit_reached: "report_key_limit_reached"
};

// Status Display Text
export const STATUS_DISPLAY_TEXT: Record<KeyReportEvent, string> = {
  report_key_working: "✅ Working",
  report_key_expired: "❌ Expired",
  report_key_limit_reached: "⚠️ Limit Reached"
};

// Status Display Text (from CDKeyStatus)
export const CDKEY_STATUS_DISPLAY_TEXT: Record<CDKeyStatus, string> = {
  working: "✅ Working",
  expired: "❌ Expired",
  limit_reached: "⚠️ Limit Reached"
};

// Button Configuration for Report Actions
export interface ReportButtonConfig {
  label: string;
  bgColor: string;
  icon: React.ReactNode;
}

// Get button configuration for report actions
export function getReportButtonConfig(status: CDKeyStatus): ReportButtonConfig {
  const configs: Record<CDKeyStatus, ReportButtonConfig> = {
    working: {
      label: "Working",
      bgColor: "bg-green-600 hover:bg-green-700 disabled:bg-green-600/50",
      icon: null // Will be set by component using React icons
    },
    expired: {
      label: "Expired",
      bgColor: "bg-red-600 hover:bg-red-700 disabled:bg-red-600/50",
      icon: null // Will be set by component using React icons
    },
    limit_reached: {
      label: "Limit Reached",
      bgColor: "bg-orange-600 hover:bg-orange-700 disabled:bg-orange-600/50",
      icon: null // Will be set by component using React icons
    }
  };

  return configs[status];
}

// Get status text from event type
export function getStatusTextFromEventType(eventType: string): string {
  return STATUS_DISPLAY_TEXT[eventType as KeyReportEvent] || eventType;
}

// Get status text from CD key status
export function getStatusTextFromCDKeyStatus(status: CDKeyStatus): string {
  return CDKEY_STATUS_DISPLAY_TEXT[status];
}

// Check if a key is expiring soon (existing function from cdKeyUtils.ts)
/**
 * Checks if a CD key is expiring within 30 days
 * @param key - The CD key object with validUntil date
 * @returns true if the key expires within 30 days (but not yet expired)
 */
export function isKeyExpiringSoon(key: { validUntil?: string }): boolean {
  if (!key.validUntil) return false;

  const validUntil = new Date(key.validUntil);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
}

/**
 * Gets a human-readable message for expiring keys
 * @param cdKeys - Array of CD keys to check
 * @returns A message describing how soon keys are expiring, or null if no expiring keys
 */
export function getExpiringKeysMessage(cdKeys: Array<{ validUntil?: string }>): string | null {
  const expiringKeys = cdKeys.filter(isKeyExpiringSoon);
  if (expiringKeys.length === 0) return null;

  // Find the soonest expiring key
  const now = new Date();
  let minDays = Infinity;

  expiringKeys.forEach(key => {
    if (key.validUntil) {
      const validUntil = new Date(key.validUntil);
      const daysUntilExpiry = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry < minDays) minDays = daysUntilExpiry;
    }
  });

  if (minDays === 1) {
    return "Some keys expire in 24 hours. Activate them now before they expire!";
  } else if (minDays <= 3) {
    return `Some keys expire in ${minDays} days. Activate them soon before they expire!`;
  } else if (minDays <= 7) {
    return "Some keys expire within a week. Activate them before they expire!";
  } else {
    return `Some keys expire within a month (${minDays} days). Activate them before they expire!`;
  }
}

// Get status color classes (existing function from cdKeyUtils.ts)
export function getStatusColor(status: string): string {
  switch (status) {
    case "new":
      return "bg-primary-500 text-white";
    case "active":
      return "bg-green-500 text-white";
    case "expired":
      return "bg-red-500 text-white";
    case "limit":
      return "bg-orange-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

// Process CD keys to update their status based on current time
export function processCdKeys(cdKeys: CDKey[]): CDKey[] {
  const now = new Date();

  return cdKeys.map(key => {
    // If key is already expired or limit reached, don't change it
    if (key.status === "expired" || key.status === "limit") {
      return key;
    }

    // Check if key should be expired based on validUntil date
    if (key.validUntil) {
      const validUntil = new Date(key.validUntil);
      if (now > validUntil) {
        return { ...key, status: "expired" };
      }
    }

    // Return key unchanged if no status update needed
    return key;
  });
}

// Sort CD keys by status priority (working keys first, then expired, then limit reached)
export function sortCdKeysByStatus(cdKeys: CDKey[]): CDKey[] {
  const statusPriority: Record<string, number> = {
    new: 1,
    active: 1,
    working: 1,
    expired: 2,
    limit: 3,
    limit_reached: 3
  };

  return [...cdKeys].sort((a, b) => {
    const priorityA = statusPriority[a.status] || 999;
    const priorityB = statusPriority[b.status] || 999;

    // If same priority, sort by validFrom date (newest first)
    if (priorityA === priorityB) {
      const dateA = new Date(a.validFrom || 0).getTime();
      const dateB = new Date(b.validFrom || 0).getTime();
      return dateB - dateA;
    }

    return priorityA - priorityB;
  });
}

/**
 * Calculate a quality score for a CD key based on version, status, and reports
 * Higher score = better quality (shown first)
 */
export function calculateKeyScore(
  cdKey: CDKey,
  reportData: { working: number; expired: number; limit_reached: number }
): number {
  let score = 0;

  // 1. Version priority (most important - weight: 10000)
  const version = parseFloat(cdKey.version || "0");
  score += version * 10000;

  // 2. Status priority (weight: 1000)
  const statusScores: Record<string, number> = {
    new: 4,
    active: 3,
    limit: 2,
    limit_reached: 2,
    expired: 1
  };
  score += (statusScores[cdKey.status] || 0) * 1000;

  // 3. Report ratio (weight: 1-100)
  const totalReports = reportData.working + reportData.expired + reportData.limit_reached;
  if (totalReports > 0) {
    const positiveRatio = reportData.working / totalReports;
    score += positiveRatio * 100;
  } else {
    // No reports = neutral score (50)
    score += 50;
  }

  return score;
}

/**
 * Sort CD keys by custom quality score (version > status > reports)
 */
export function sortCdKeysByScore(
  cdKeys: CDKey[],
  reportDataMap: Map<string, { working: number; expired: number; limit_reached: number }>
): CDKey[] {
  return [...cdKeys].sort((a, b) => {
    const reportA = reportDataMap.get(a.key) || { working: 0, expired: 0, limit_reached: 0 };
    const reportB = reportDataMap.get(b.key) || { working: 0, expired: 0, limit_reached: 0 };

    const scoreA = calculateKeyScore(a, reportA);
    const scoreB = calculateKeyScore(b, reportB);

    return scoreB - scoreA; // Descending (highest score first)
  });
}

/**
 * Sort CD keys by a specific column
 */
export function sortCdKeysByColumn(
  cdKeys: CDKey[],
  sortColumn: string,
  sortDirection: "asc" | "desc",
  reportDataMap: Map<string, { working: number; expired: number; limit_reached: number }>
): CDKey[] {
  return [...cdKeys].sort((a, b) => {
    let compareA: number;
    let compareB: number;

    switch (sortColumn) {
      case "status":
        const statusOrder: Record<string, number> = { new: 1, active: 2, limit: 3, expired: 4 };
        compareA = statusOrder[a.status] || 999;
        compareB = statusOrder[b.status] || 999;
        break;
      case "version":
        compareA = parseFloat(a.version || "0");
        compareB = parseFloat(b.version || "0");
        break;
      case "validFrom":
        compareA = new Date(a.validFrom || 0).getTime();
        compareB = new Date(b.validFrom || 0).getTime();
        break;
      case "validUntil":
        compareA = new Date(a.validUntil || 0).getTime();
        compareB = new Date(b.validUntil || 0).getTime();
        break;
      case "reports":
        const reportA = reportDataMap.get(a.key) || { working: 0, expired: 0, limit_reached: 0 };
        const reportB = reportDataMap.get(b.key) || { working: 0, expired: 0, limit_reached: 0 };
        const totalA = reportA.working + reportA.expired + reportA.limit_reached;
        const totalB = reportB.working + reportB.expired + reportB.limit_reached;
        // Sort by positive ratio (working reports / total reports)
        const ratioA = totalA > 0 ? reportA.working / totalA : 0.5;
        const ratioB = totalB > 0 ? reportB.working / totalB : 0.5;
        compareA = ratioA;
        compareB = ratioB;
        break;
      default:
        return 0;
    }

    if (compareA < compareB) return sortDirection === "asc" ? -1 : 1;
    if (compareA > compareB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });
}
