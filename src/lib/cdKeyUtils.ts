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
export function isKeyExpiringSoon(key: { validUntil?: string }): boolean {
  if (!key.validUntil) return false;

  const validUntil = new Date(key.validUntil);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
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
