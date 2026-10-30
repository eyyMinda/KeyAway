// Admin-related types
import type { CDKeyStatus, ProgramFlow, ProgramPlatform } from "../program";

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
  /** Array `_key` of the matched activation row; missing once the key is removed from the program. */
  keyId?: string;
  /** Version the activation row is listed for. */
  keyVersion?: string;
  /** Newest official version on the program. */
  latestVersion?: string;
  programSlug: string;
  /** Sanity id, for the program editor link. */
  programId?: string;
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
    otherVersion: number;
    otherVersionLabels: string[];
  };
  reports: Array<{
    _id: string;
    ipHash?: string;
    referrer?: string;
    createdAt: string;
    country?: string;
    city?: string;
    eventType: "report_key_working" | "report_key_expired" | "report_key_limit_reached";
    listedVersion?: string;
    triedVersionFit?: "listed" | "other";
    triedVersion?: string;
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

/** One activation entry as shown in the admin programs list (no passwords). */
export interface AdminProgramKeyRow {
  _key: string;
  key?: string;
  status: CDKeyStatus;
  version?: string;
  validUntil?: string;
  createdAt?: string;
  accountLabel?: string;
  username?: string;
  linkTitles?: string[] | null;
}

/** Row of the admin programs list (`adminProgramListProjection`). */
export interface AdminProgramRow {
  _id: string;
  _updatedAt: string;
  title: string;
  slug: { current: string };
  programFlow: ProgramFlow;
  latestOfficialVersion?: string | null;
  downloadLink?: string | null;
  vendor?: { _id: string; name: string } | null;
  categories?: { _id: string; title: string }[] | null;
  platforms: ProgramPlatform[];
  image?: { asset?: { _ref?: string } } | null;
  aliases?: string[] | null;
  popularity: number;
  aboutCount?: number | null;
  faqCount?: number | null;
  freeVsProCount?: number | null;
  hasSeo?: boolean;
  versionCheck?: {
    source?: string | null;
    packageId?: string | null;
    pageUrl?: string | null;
    installerUrl?: string | null;
    pattern?: string | null;
    autoApply?: boolean | null;
  } | null;
  versionStatus?: {
    latestVersion?: string | null;
    releasedAt?: string | null;
    error?: string | null;
    changedAt?: string | null;
  } | null;
  cdKeys?: AdminProgramKeyRow[] | null;
}

/** Program document as loaded into the admin editor (`adminProgramEditorQuery`). */
export interface AdminProgramDoc {
  _id: string;
  _rev: string;
  _updatedAt: string;
  hasDraft?: boolean;
  [field: string]: unknown;
}

/** Row of the admin vendors list (`adminVendorListProjection`). */
export interface AdminVendorRow {
  _id: string;
  _updatedAt: string;
  name: string;
  slug?: { current?: string } | null;
  logo?: { asset?: { _ref?: string } } | null;
  logoBackgroundColor?: { hex?: string; alpha?: number; rgb?: { r: number; g: number; b: number; a?: number } } | null;
  aliases?: string[] | null;
  hasDescription?: boolean;
  comparisonCount?: number | null;
  hasSeo?: boolean;
  programCount: number;
}

/** Vendor document as loaded into the admin vendor editor (`adminVendorEditorQuery`). */
export interface AdminVendorDoc {
  _id: string;
  _rev: string;
  _updatedAt: string;
  hasDraft?: boolean;
  programs?: { _id: string; title: string }[];
  [field: string]: unknown;
}
