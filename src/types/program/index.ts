// Program and CD Key related types
export type CDKeyStatus = "new" | "active" | "expired" | "limit";

export interface CDKey {
  key: string;
  status: CDKeyStatus;
  version: string;
  validFrom: string;
  validUntil: string;
}

export interface Program {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  image?: { asset: { url: string } };
  downloadLink?: string;
  cdKeys: CDKey[];
  _updatedAt?: string;
}

// Component props for program-related components
export interface CDKeyTableProps {
  cdKeys: CDKey[];
  slug: string;
}

export interface ReportData {
  working: number;
  expired: number;
  limit_reached: number;
}

export interface CDKeyItemProps {
  cdKey: CDKey;
  index: number;
  slug: string;
  reportData: ReportData;
  onReportSubmitted?: () => void;
}

export interface CDKeyActionsProps {
  cdKey: CDKey;
  isDisabled: boolean;
  slug: string;
  onReportSubmitted?: () => void;
}

export interface ProgramInformationProps {
  program: Program;
  totalKeys: number;
  workingKeys: number;
}

export interface ProgramPageProps {
  params: Promise<{ slug: string }>;
}

export interface KeyStatusUpdaterProps {
  initialKeys: CDKey[];
  onKeysUpdate: (updatedKeys: CDKey[]) => void;
}

// Hook props
export interface UseCopyTrackingProps {
  cdKey: CDKey;
  slug: string;
}
