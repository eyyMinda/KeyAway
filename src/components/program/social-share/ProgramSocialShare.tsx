import SocialShare from "@/src/components/social-share/SocialShare";
import { buildProgramShareInput } from "@/src/lib/share/buildSharePayload";
import type { ProgramShareCounts } from "@/src/lib/program/getProgramShareCounts";

export type ProgramSocialShareProps = {
  programTitle: string;
  programSlug: string;
  pageUrl: string;
  workingKeys: number;
  imageUrl?: string;
  shareCounts?: ProgramShareCounts;
};

export default function ProgramSocialShare({
  programTitle,
  programSlug,
  pageUrl,
  workingKeys,
  imageUrl,
  shareCounts
}: ProgramSocialShareProps) {
  return (
    <SocialShare
      shareId={programSlug}
      shareInput={buildProgramShareInput({ programTitle, programSlug, pageUrl, workingKeys, imageUrl })}
      programSlug={programSlug}
      shareCounts={shareCounts}
      ariaLabel="Share this program"
    />
  );
}
