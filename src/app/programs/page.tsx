import { client } from "@/src/sanity/lib/client";
import { programsWithStatsQuery, programsCountQuery } from "@lib/queries";
import { generateProgramsPageMetadata } from "@/src/lib/metadata";
import { generateProgramsPageJsonLd } from "@/src/lib/jsonLd";
import JsonLd from "@/src/components/JsonLd";
import ProgramsPageClient from "@/src/app/programs/ProgramsPageClient";
import ProgramsHero from "@/src/components/programs/ProgramsHero";
import type { Program } from "@/src/types";

export const revalidate = 60;

export async function generateMetadata() {
  return generateProgramsPageMetadata();
}

export default async function ProgramsPage() {
  // Fetch all programs with stats for client-side filtering
  const [programs, totalCount] = await Promise.all([
    client.fetch(programsWithStatsQuery, {}, { next: { tags: ["programs"] } }),
    client.fetch(programsCountQuery, {}, { next: { tags: ["programs"] } })
  ]);

  // Generate JSON-LD for programs page
  const jsonLd = generateProgramsPageJsonLd(programs, totalCount);

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <ProgramsHero
          totalCount={totalCount}
          totalKeys={programs.reduce((sum: number, p: Program) => sum + (p.cdKeys?.length || 0), 0)}
        />

        {/* Programs Grid with Filtering */}
        <ProgramsPageClient programs={programs} />
      </main>
    </>
  );
}
