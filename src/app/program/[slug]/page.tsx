import { CDKey } from "@/src/types";
import { notFound } from "next/navigation";
import ProgramInformation from "@/src/components/program/ProgramInformation";
import CDKeyTable from "@/src/components/program/cdkeys/CDKeyTable";
import ActivationInstructions from "@/src/components/program/ActivationInstructions";
import RelatedPrograms from "@/src/components/program/RelatedPrograms";
import CommentsSection from "@/src/components/program/comments/CommentsSection";
import { sortCdKeysByStatus } from "@/src/lib/cdKeyUtils";
import { getProgramWithUpdatedKeys } from "@/src/lib/sanityActions";
import { client } from "@/src/sanity/lib/client";
import { popularProgramsQuery } from "@/src/lib/queries";
import { generateProgramMetadata } from "@/src/lib/metadata";

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

    // Get program with automatically updated expired keys
    const program = await getProgramWithUpdatedKeys(slug);

    if (!program) return notFound();

    // Sort CD keys by status (they're already updated in Sanity)
    const sortedCdKeys = sortCdKeysByStatus(program.cdKeys || []);

    // Calculate stats for the program information
    const totalKeys = sortedCdKeys.length;
    const workingKeys = sortedCdKeys.filter((cd: CDKey) => cd.status === "active" || cd.status === "new").length;

    // Get related programs (excluding current program)
    const allPrograms = await client.fetch(popularProgramsQuery);
    const relatedPrograms = allPrograms
      .filter((p: { slug: { current: string } }) => p.slug.current !== slug)
      .slice(0, 5);

    return (
      <main className="min-h-screen bg-neutral-900">
        {/* 1. Program Information - Most Important */}
        <ProgramInformation program={program} totalKeys={totalKeys} workingKeys={workingKeys} />

        {/* 2. CD Key Table - Second Most Important */}
        <CDKeyTable cdKeys={sortedCdKeys} slug={slug} />

        {/* 3. Activation Instructions */}
        <ActivationInstructions />

        {/* 4. Related Programs */}
        <RelatedPrograms programs={relatedPrograms} currentSlug={slug} />

        {/* 5. Comments Section */}
        <CommentsSection />
      </main>
    );
  } catch (error) {
    console.error("Error in ProgramPage:", error);
    return notFound();
  }
}
