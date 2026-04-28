/**
 * @fileoverview Program/CDKey shapes and props for program UI.
 */
import type { PortableTextBlock } from "@portabletext/types";
import type { VisitorHintData } from "@/src/lib/visitors/publicVisitorContext";
import type { SocialData } from "../layout";

export type CDKeyStatus = "new" | "active" | "expired" | "limit";

/** How activation is delivered for this program (Sanity `program.programFlow`). */
export type ProgramFlow = "cd_key" | "link_based_cdkey" | "account" | "link_based_account";

export interface GiveawayLink {
  title?: string;
  url?: string;
  note?: string;
}

export interface CDKey {
  /** CD key string (cd_key / link_based_cdkey flows). */
  key?: string;
  status: CDKeyStatus;
  version: string;
  validFrom?: string;
  /** Empty / omitted = lifetime (no fixed expiry). */
  validUntil?: string;
  createdAt?: string;
  /** Optional label shown in UI / admin (account flow). */
  accountLabel?: string;
  username?: string;
  password?: string;
  /** Signup / partner links where users obtain PRO access (link_based_account). */
  giveawayLinks?: GiveawayLink[];
}

export interface ProgramFaqItem {
  question: string;
  answer: PortableTextBlock[] | string;
}

/** Sanity image field shape (asset ref for urlFor). */
export type SanityImageField = { asset?: { _ref?: string; url?: string } };

export interface ProgramAboutPoint {
  text: PortableTextBlock[] | string;
  icon?: SanityImageField;
}

export interface ProgramAboutSectionBlock {
  sectionTitle?: string;
  description: PortableTextBlock[] | string;
  image?: SanityImageField;
  /** Desktop: image on the right when true (default: image left). */
  invertDesktop?: boolean;
  /** Mobile: image below content when true (default: image above). */
  invertMobile?: boolean;
  points?: ProgramAboutPoint[];
}

export interface ProgramFeatured {
  /** Featured homepage copy; optional portable text. */
  description?: PortableTextBlock[] | string | null;
  showcaseGif?: SanityImageField;
}

export interface Program {
  _id: string;
  title: string;
  slug: { current: string };
  /** Defaults to cd_key when omitted (legacy documents). */
  programFlow?: ProgramFlow;
  description: PortableTextBlock[] | string;
  featured?: ProgramFeatured;
  /** Vendor-reported current version (e.g. from product page). */
  latestOfficialVersion?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
  };
  /** Optional about blocks (max 4 in CMS). */
  aboutSections?: ProgramAboutSectionBlock[];
  faq?: ProgramFaqItem[];
  image?: { asset: { url?: string; _ref?: string } };
  downloadLink?: string;
  cdKeys: CDKey[];
  keyCount?: number;
  hasKeys?: boolean;
  descriptionPlain?: string;
  viewCount?: number;
  downloadCount?: number;
  popularityScore?: number;
  _updatedAt?: string;
}

export interface CDKeyTableProps {
  cdKeys: CDKey[];
  /** Same length/order as `cdKeys`; server row storage key per row (`getRowStorageHash`: plaintext / username / link digest). */
  rowStorageIds: string[];
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
  rowStorageId: string;
  slug: string;
  programFlow: ProgramFlow;
  reportData: ReportData;
  onReportSubmitted?: () => void;
  isSpammerVisitor?: boolean;
}

export interface CDKeyActionsProps {
  cdKey: CDKey;
  rowStorageId: string;
  isDisabled: boolean;
  slug: string;
  programFlow: ProgramFlow;
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
  programFlow: ProgramFlow;
  /** Clipboard text that counts as a tracked copy for this row. */
  clipboardMatch: string;
}
