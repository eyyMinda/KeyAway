import { Program } from "@/src/types/program";
import { SectionId } from "@/src/lib/analytics/interactionCatalog";

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
  sectionId?: SectionId;
}

export interface PopularProgramsSectionProps {
  programs: ProgramWithStats[];
}

// Section props can be added here when needed

export interface StatsSectionProps {
  totalPrograms: number;
  totalKeys: number;
  totalReports: number;
  recentReports: number;
}
