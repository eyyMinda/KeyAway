import { Program } from "@/src/types/program";

export interface ProgramWithStats extends Program {
  viewCount: number;
  downloadCount: number;
  hasKeys: boolean;
  popularityScore: number;
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
