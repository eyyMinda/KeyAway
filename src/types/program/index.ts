/**
 * @fileoverview Program/CDKey shapes and props for program UI.
 */
import type { VisitorHintData } from "@/src/lib/visitors/publicVisitorContext";
import type { SocialData } from "../layout";

export type CDKeyStatus = "new" | "active" | "expired" | "limit";

export interface CDKey {
  key: string;
  status: CDKeyStatus;
  version: string;
  validFrom?: string;
  /** Empty / omitted = lifetime (no fixed expiry). */
  validUntil?: string;
  createdAt?: string;
}

export interface ProgramFaqItem {
  question: string;
  answer: string;
}

/** Sanity image field shape (asset ref for urlFor). */
export type SanityImageField = { asset?: { _ref?: string; url?: string } };

export interface ProgramAboutPoint {
  text: string;
  icon?: SanityImageField;
}

export interface ProgramAboutSectionBlock {
  sectionTitle?: string;
  description: string;
  image?: SanityImageField;
  /** Desktop: image on the right when true (default: image left). */
  invertDesktop?: boolean;
  /** Mobile: image below content when true (default: image above). */
  invertMobile?: boolean;
  points?: ProgramAboutPoint[];
}

/** Homepage featured block (Sanity `program.featured`). */
export interface ProgramFeatured {
  featuredDescription?: string | null;
  showcaseGif?: SanityImageField;
}

export interface Program {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  /** Homepage featured copy + GIF (nested in CMS like `seo`). */
  featured?: ProgramFeatured;
  /** Vendor-reported current version (e.g. from product page). */
  latestOfficialVersion?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
  /** Optional about blocks (max 4 in CMS). */
  aboutSections?: ProgramAboutSectionBlock[];
  faq?: ProgramFaqItem[];
  image?: { asset: { url?: string; _ref?: string } };
  downloadLink?: string;
  cdKeys: CDKey[];
  _updatedAt?: string;
}

export interface CDKeyTableProps {
  cdKeys: CDKey[];
  slug: string;
  program: Program;
  /** Program name for table heading and intro copy. */
  programTitle: string;
  /** When true (visitor marked spammer), only “Working” reports are allowed; negative statuses are disabled in UI and API. */
  isSpammerVisitor?: boolean;
  /** `latestOfficialVersion` when safe to show in the intro (not duplicated in supplemental). */
  vendorReleaseForIntro?: string | null;
  /** Short confirmation when listed keys match the vendor release. */
  introVersionConfirmation?: string | null;
  /** Mismatch or keys-only nuance (muted). */
  versionSummaryLine?: string | null;
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
  isSpammerVisitor?: boolean;
}

export interface CDKeyActionsProps {
  cdKey: CDKey;
  isDisabled: boolean;
  slug: string;
  onReportSubmitted?: () => void;
  isSpammerVisitor?: boolean;
}

export interface ProgramInformationProps {
  program: Program;
  totalKeys: number;
  workingKeys: number;
  socialData?: SocialData;
  visitorHint?: VisitorHintData | null;
}

export interface ProgramPageProps {
  params: Promise<{ slug: string }>;
}

export interface KeyStatusUpdaterProps {
  initialKeys: CDKey[];
  onKeysUpdate: (updatedKeys: CDKey[]) => void;
}

export interface UseCopyTrackingProps {
  cdKey: CDKey;
  slug: string;
}
