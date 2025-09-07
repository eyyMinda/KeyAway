import { CDKey } from "@/src/types/ProgramType";
import { notFound } from "next/navigation";
import ProgramInformation from "@/src/components/program/ProgramInformation";
import CDKeyTable from "@/src/components/program/cdkeys/CDKeyTable";
import CommentsSection from "@/src/components/program/comments/CommentsSection";
import { sortCdKeysByStatus } from "@/src/lib/cdKeyUtils";
import { getProgramWithUpdatedKeys } from "@/src/lib/sanityActions";

interface ProgramPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { slug } = await params;

  // Get program with automatically updated expired keys
  const program = await getProgramWithUpdatedKeys(slug);

  if (!program) return notFound();

  // Sort CD keys by status (they're already updated in Sanity)
  const sortedCdKeys = sortCdKeysByStatus(program.cdKeys || []);

  // Calculate stats for the program information
  const totalKeys = sortedCdKeys.length;
  const workingKeys = sortedCdKeys.filter((cd: CDKey) => cd.status === "active" || cd.status === "new").length;

  return (
    <main className="min-h-screen bg-neutral-900">
      <ProgramInformation program={program} totalKeys={totalKeys} workingKeys={workingKeys} />

      <CDKeyTable cdKeys={sortedCdKeys} />

      <CommentsSection />
    </main>
  );
}
