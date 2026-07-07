import SocialShare from "@/src/components/social-share/SocialShare";
import { buildProgramsIndexShareInput } from "@/src/lib/share/buildSharePayload";
import type { ShareCounts } from "@/src/lib/share/buildSharePayload";

export type ProgramsPageSocialShareProps = {
  pageUrl: string;
  programCount: number;
  totalKeys: number;
  imageUrl?: string;
  shareCounts?: ShareCounts;
};

export default function ProgramsPageSocialShare({
  pageUrl,
  programCount,
  totalKeys,
  imageUrl,
  shareCounts
}: ProgramsPageSocialShareProps) {
  return (
    <SocialShare
      shareId="programs"
      shareInput={buildProgramsIndexShareInput(pageUrl, programCount, totalKeys, imageUrl)}
      shareCounts={shareCounts}
      ariaLabel="Share all programs"
    />
  );
}
