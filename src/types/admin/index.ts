// Admin-related types
import type { CDKeyStatus, ProgramFlow } from "../program";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface AdminAccessResult {
  isAdmin: boolean;
  loading: boolean;
}

export interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export interface ProtectedAdminLayoutProps {
  title?: string;
  subtitle?: string;
  /** Custom header (e.g. WelcomeHeader). Replaces title+subtitle when provided */
  headerContent?: React.ReactNode;
  children: React.ReactNode;
}

// Analytics types
export interface AnalyticsCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon?: string;
  color?: "blue" | "green" | "purple" | "orange" | "red";
}

export interface DataTableProps {
  title: string;
  data: Array<{ key: string; value: number; label?: string }>;
  maxItems?: number;
  showPercentage?: boolean;
}

export interface EventChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  title: string;
  type?: "bar" | "doughnut" | "line";
}

export interface TimeFilterProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  customDateRange?: {
    start: Date;
    end: Date;
  };
}

/** Aggregated admin row: community key reports for one program + activation storage key. */
export interface KeyReport {
  /** Display label (CD key text, account label, or link titles). */
  key: string;
  /** Row storage key: plaintext CD key / lowercase username / link digest — matches `getRowStorageHash` & keyReport `key`. */
  storageKey: string;
  /** Program flow when aggregating (from CMS); used to resolve activation row fields for the modal. */
  programFlow?: ProgramFlow;
  /** Account flow: username from matched `program.cdKeys[]` row (not stored on keyReport). */
  resolvedUsername?: string;
  /** Account flow: password from matched program row. */
  resolvedPassword?: string;
  /** Key-like flows: raw `cdKey.key` from program row for admin display. */
  resolvedCdKey?: string;
  programSlug: string;
  programTitle: string;
  reportCount: number;
  firstReported: string;
  lastReported: string;
  status: CDKeyStatus;
  validFrom?: string;
  validTo?: string;
  reportData: {
    working: number;
    expired: number;
    limit_reached: number;
  };
  reports: Array<{
    _id: string;
    ipHash?: string;
    referrer?: string;
    createdAt: string;
    country?: string;
    city?: string;
    eventType: "report_key_working" | "report_key_expired" | "report_key_limit_reached";
  }>;
}

/** Admin header key-report notification item (from GET /api/v1/admin/key-report-notifications). */
export interface KeyReportNotificationItem {
  programSlug: string;
  programTitle: string;
  label: string;
  negativeCount: number;
  positiveCount: number;
  working: number;
  expired: number;
  limit_reached: number;
  ratioLabel: string;
  /** ISO date of most recent report */
  lastReportAt?: string;
  link: string;
}
