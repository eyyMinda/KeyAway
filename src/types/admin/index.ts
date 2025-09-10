// Admin-related types
import { CDKeyStatus } from "../program";

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
  title: string;
  subtitle: string;
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

// Expired key reporting types
export interface ExpiredKeyReport {
  key: string; // Actual CD key
  keyHash: string; // Hash for privacy
  keyIdentifier: string; // Short identifier like ABC***XYZ
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
    createdAt: string;
    country?: string;
    city?: string;
    eventType: "report_key_working" | "report_key_expired" | "report_key_limit_reached";
  }>;
}
