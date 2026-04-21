import { client } from "@/src/sanity/lib/client";
import { programsWithStatsQuery, programsCountQuery } from "@lib/sanity/queries";
import { getCachedStoreDetailsDocument } from "@/src/lib/sanity/getCachedStoreDetails";
import { getBundleCountsByProgram, mergeProgramStats } from "@/src/lib/analytics/eventsApi";
import type { ProgramWithStats } from "@/src/types/home";
import { generateProgramsPageMetadata } from "@/src/lib/seo/metadata";
import { generateProgramsPageJsonLd } from "@/src/lib/seo/jsonLd";
import { resolveSiteBaseUrl } from "@/src/lib/seo/storeSeoResolve";
import JsonLd from "@/src/components/JsonLd";
import ProgramsPageClient from "@/src/app/programs/ProgramsPageClient";
import {
  ProgramsHero,
  ContributeSection,
  WhyUseSection
} from "@/src/components/programs";
import FeaturedProgramSection from "@/src/components/home/FeaturedProgramSection";
import { FacebookGroupButton } from "@/src/components/social";
import { getFeaturedProgram } from "@/src/lib/sanity/sanityActions";
import type { SocialData } from "@/src/types";

export const revalidate = 60;

export async function generateMetadata() {
  return await generateProgramsPageMetadata();
}

export default async function ProgramsPage() {
  const [rawPrograms, bundleCounts, totalCount, storeRow, featuredProgram] = await Promise.all([
    client.fetch(programsWithStatsQuery, {}, { next: { tags: ["programs"] } }),
    getBundleCountsByProgram(),
    client.fetch(programsCountQuery, {}, { next: { tags: ["programs"] } }),
    getCachedStoreDetailsDocument(),
    getFeaturedProgram()
  ]);

  const programs = mergeProgramStats((rawPrograms ?? []) as ProgramWithStats[], bundleCounts) as ProgramWithStats[];

  const socialData: SocialData = {
    socialLinks: storeRow?.socialLinks ?? []
  };

  const totalKeys = programs.reduce((sum, p) => sum + (p.cdKeys?.length || 0), 0);
  const jsonLd = generateProgramsPageJsonLd(programs, totalCount, resolveSiteBaseUrl(storeRow?.seo));

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="min-h-screen bg-gray-50">
        <ProgramsHero totalCount={totalCount} totalKeys={totalKeys} />

        <section className="py-8 bg-linear-to-b from-gray-50 to-gray-100">
          <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
            <FacebookGroupButton socialData={socialData} variant="outline" className="text-base" />
          </div>
        </section>

        <ProgramsPageClient programs={programs} />

        <ContributeSection />
        <FeaturedProgramSection program={featuredProgram} />
        <WhyUseSection />
      </main>
    </>
  );
}
