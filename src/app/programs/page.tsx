import { client } from "@/src/sanity/lib/client";
import { getCachedStoreDetailsDocument } from "@/src/lib/sanity/getCachedStoreDetails";
import { getBundleCountsByProgram, mergeProgramStats } from "@/src/lib/analytics/eventsApi";
import { programsListingProjection } from "@/src/lib/sanity/queries";
import type { ProgramWithStats } from "@/src/types/home";
import { generateProgramsPageMetadata } from "@/src/lib/seo/metadata";
import { generateProgramsPageJsonLd } from "@/src/lib/seo/jsonLd";
import { resolveSiteBaseUrl } from "@/src/lib/seo/storeSeoResolve";
import JsonLd from "@/src/components/JsonLd";
import ProgramsPageClient from "@/src/app/programs/ProgramsPageClient";
import { ProgramsHero, ContributeSection, WhyUseSection } from "@/src/components/programs";
import FeaturedProgramSection from "@/src/components/home/FeaturedProgramSection";
import { FacebookGroupButton } from "@/src/components/social";
import { getFeaturedProgram } from "@/src/lib/sanity/sanityActions";
import type { SocialData } from "@/src/types";
import type { FilterType, SortType } from "@/src/types/programs";
import { portableTextToPlainText } from "@/src/lib/portableText/toPlainText";
import { normalizeFilterType, normalizeSortType, sortPrograms } from "@/src/lib/program/programUtils";
import { PUBLIC_ISR_REVALIDATE_SECONDS } from "@/src/lib/cache/constants";
import { TAG_PROGRAM_LISTINGS } from "@/src/lib/cache/cacheTags";

export const revalidate = PUBLIC_ISR_REVALIDATE_SECONDS;
const PROGRAMS_PER_PAGE = 16;

export async function generateMetadata() {
  return await generateProgramsPageMetadata();
}

export default async function ProgramsPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string; filter?: FilterType; sort?: SortType; page?: string }>;
}) {
  const params = await searchParams;
  const searchTerm = (params.search || "").trim();
  const filter: FilterType = normalizeFilterType(params.filter);
  const sortBy: SortType = normalizeSortType(params.sort);
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const start = (page - 1) * PROGRAMS_PER_PAGE;
  const end = start + PROGRAMS_PER_PAGE;
  const filterQuery = filter === "hasKeys" ? "count(cdKeys[]) > 0" : filter === "noKeys" ? "count(cdKeys[]) == 0" : "true";
  const searchFilter = searchTerm ? " && (title match $search || string::lower(pt::text(description)) match $search)" : "";
  const listQuery = `*[_type == "program" && ${filterQuery}${searchFilter}] {${programsListingProjection}}`;
  const queryParams = searchTerm ? { search: `*${searchTerm.toLowerCase()}*` } : {};

  const [rawPrograms, bundleCounts, storeRow, featuredProgram] = await Promise.all([
    client.fetch(listQuery, queryParams, { next: { tags: [TAG_PROGRAM_LISTINGS] } }),
    getBundleCountsByProgram(),
    getCachedStoreDetailsDocument(),
    getFeaturedProgram()
  ]);

  const mergedPrograms = mergeProgramStats((rawPrograms ?? []) as ProgramWithStats[], bundleCounts);

  const sortedPrograms = sortPrograms(mergedPrograms, sortBy);

  const totalCount = sortedPrograms.length;
  const programs = sortedPrograms.slice(start, end).map(program => ({
    ...program,
    descriptionPlain: portableTextToPlainText(program.description)
  })) as ProgramWithStats[];

  const socialData: SocialData = {
    socialLinks: storeRow?.socialLinks ?? []
  };

  const totalKeys = programs.reduce((sum, p) => sum + (p.keyCount || p.cdKeys?.length || 0), 0);
  const jsonLd = generateProgramsPageJsonLd(programs, totalCount, resolveSiteBaseUrl(storeRow?.seo));

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="min-h-screen bg-gray-100">
        <ProgramsHero totalCount={totalCount} totalKeys={totalKeys} />

        <section className="py-8 bg-linear-to-b from-gray-50 to-gray-100">
          <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
            <FacebookGroupButton socialData={socialData} variant="outline" className="text-base" />
          </div>
        </section>

        <ProgramsPageClient
          programs={programs}
          searchTerm={searchTerm}
          filter={filter}
          sortBy={sortBy}
          currentPage={page}
          totalPrograms={totalCount}
          programsPerPage={PROGRAMS_PER_PAGE}
        />

        <ContributeSection />
        <FeaturedProgramSection program={featuredProgram} />
        <WhyUseSection />
      </main>
    </>
  );
}
