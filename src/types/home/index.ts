import { Program } from "@/src/types/program";

export interface ProgramWithStats extends Program {
  viewCount: number;
  downloadCount: number;
  hasKeys: boolean;
  popularityScore: number;
  keyCount?: number;
  _createdAt: string;
}

export interface ProgramCardProps {
  program: Program;
  stats?: {
    viewCount?: number;
    downloadCount?: number;
  };
  badges?: {
    mostViewed?: boolean;
    mostDownloaded?: boolean;
  };
  showStats?: boolean;
}

import type { VendorListItem } from "@/src/lib/vendors/getVendors";

export interface PopularProgramsSectionProps {
  programs: ProgramWithStats[];
  vendors?: VendorListItem[];
}

// Section props can be added here when needed

export interface StatsSectionProps {
  totalPrograms: number;
  totalKeys: number;
  totalReports: number;
  recentReports: number;
}
