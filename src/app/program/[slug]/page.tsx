/** @fileoverview Program detail: keys, related programs, JSON-LD; visitor context for hero and spammer gate on reports. */
import { CDKey, SocialData } from "@/src/types";
import { notFound } from "next/navigation";
import ProgramInformation from "@/src/components/program/ProgramInformation";
import CDKeyTable from "@/src/components/program/cdkeys/CDKeyTable";
import ContributeBanner from "@/src/components/program/ContributeBanner";
import ActivationInstructions from "@/src/components/program/ActivationInstructions";
import RelatedPrograms from "@/src/components/program/RelatedPrograms";
import CommentsSection from "@/src/components/program/comments/CommentsSection";
import { sortCdKeysByStatus } from "@/src/lib/program/cdKeyUtils";
import { getProgramWithUpdatedKeys } from "@/src/lib/sanity/sanityActions";
import { client } from "@/src/sanity/lib/client";
import { popularProgramsQuery, storeDetailsQuery, socialLinksQuery } from "@/src/lib/sanity/queries";
import { generateProgramMetadata } from "@/src/lib/seo/metadata";
import { generateProgramPageJsonLd } from "@/src/lib/seo/jsonLd";
import JsonLd from "@/src/components/JsonLd";
import { headers } from "next/headers";
import { getVisitorContextForPublicPage } from "@/src/lib/visitors/serverVisitorContext";

interface ProgramPageProps {
  params: Promise<{ slug: string }>;
}

// Generate dynamic metadata for each program page
export async function generateMetadata({ params }: ProgramPageProps) {
  const { slug } = await params;
  return generateProgramMetadata(slug);
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  try {
    const { slug } = await params;

    const program = await getProgramWithUpdatedKeys(slug);

    if (!program) return notFound();

    const sortedCdKeys = sortCdKeysByStatus(program.cdKeys || []);

    const totalKeys = sortedCdKeys.length;
    const workingKeys = sortedCdKeys.filter((cd: CDKey) => cd.status === "active" || cd.status === "new").length;

    const [allPrograms, storeData, socialLinks] = await Promise.all([
      client.fetch(popularProgramsQuery),
      client.fetch(storeDetailsQuery),
      client.fetch(socialLinksQuery)
    ]);

    const socialData: SocialData = {
      socialLinks: socialLinks || []
    };

    const hdrs = await headers();
    const { isSpammer, visitorWelcomeLine, visitorHint } = await getVisitorContextForPublicPage(hdrs);
    const relatedPrograms = allPrograms
      .filter((p: { slug: { current: string } }) => p.slug.current !== slug)
      .slice(0, 5);

    const storeInfo = storeData?.[0] || { title: "KeyAway" };
    const jsonLd = generateProgramPageJsonLd(program, workingKeys, totalKeys, storeInfo);

    return (
      <>
        <JsonLd data={jsonLd} />
        <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
          <ProgramInformation
            program={program}
            totalKeys={totalKeys}
            workingKeys={workingKeys}
            socialData={socialData}
            visitorWelcomeLine={visitorWelcomeLine}
            visitorHint={visitorHint}
          />
          <CDKeyTable cdKeys={sortedCdKeys} slug={slug} isSpammerVisitor={isSpammer} />
          <ContributeBanner />
          <ActivationInstructions />
          <RelatedPrograms programs={relatedPrograms} />
          <CommentsSection />
        </main>
      </>
    );
  } catch (error) {
    console.error("Error in ProgramPage:", error);
    return notFound();
  }
}
