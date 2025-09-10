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
  key: string;
  keyMasked: string;
  programSlug: string;
  programTitle: string;
  reportCount: number;
  firstReported: string;
  lastReported: string;
  status: CDKeyStatus;
  validFrom?: string;
  validTo?: string;
  reports: Array<{
    createdAt: string;
    country?: string;
    city?: string;
  }>;
}
