import { client } from "@/src/sanity/lib/client";
import { programsWithStatsQuery, programsCountQuery, socialLinksQuery } from "@lib/sanity/queries";
import { getBundleCountsByProgram, mergeProgramStats } from "@/src/lib/analytics/eventsApi";
import type { ProgramWithStats } from "@/src/types/home";
import { generateProgramsPageMetadata } from "@/src/lib/seo/metadata";
import { generateProgramsPageJsonLd } from "@/src/lib/seo/jsonLd";
import JsonLd from "@/src/components/JsonLd";
import ProgramsPageClient from "@/src/app/programs/ProgramsPageClient";
import { getFeaturedProgram } from "@/src/lib/sanity/sanityActions";
import type { SocialData } from "@/src/types";

export const revalidate = 60;

export async function generateMetadata() {
  return generateProgramsPageMetadata();
}

export default async function ProgramsPage() {
  // Fetch all programs with stats for client-side filtering
  const [rawPrograms, bundleCounts, totalCount, socialLinks, featuredProgram] = await Promise.all([
    client.fetch(programsWithStatsQuery, {}, { next: { tags: ["programs"] } }),
    getBundleCountsByProgram(),
    client.fetch(programsCountQuery, {}, { next: { tags: ["programs"] } }),
    client.fetch(socialLinksQuery),
    getFeaturedProgram()
  ]);

  const programs = mergeProgramStats((rawPrograms ?? []) as ProgramWithStats[], bundleCounts) as ProgramWithStats[];

  const socialData: SocialData = {
    socialLinks: socialLinks || []
  };

  // Generate JSON-LD for programs page
  const jsonLd = generateProgramsPageJsonLd(programs, totalCount);

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="min-h-screen bg-gray-50">
        {/* Programs Grid with Filtering */}
        <ProgramsPageClient programs={programs} featuredProgram={featuredProgram} socialData={socialData} />
      </main>
    </>
  );
}
