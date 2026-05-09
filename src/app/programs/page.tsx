import { client } from "@/src/sanity/lib/client";
import { getCachedStoreDetailsDocument } from "@/src/lib/sanity/getCachedStoreDetails";
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
import { getBundleCountsByProgram, mergeProgramStats } from "@/src/lib/analytics/eventsApi";
import type { SocialData } from "@/src/types";
import type { FilterType, SortType } from "@/src/types/programs";
import { portableTextToPlainText } from "@/src/lib/portableText/toPlainText";
import { normalizeFilterType, normalizeSortType, groqProgramsOrderClause } from "@/src/lib/program/programUtils";
import { TAG_PROGRAM_LISTINGS } from "@/src/lib/cache/cacheTags";

/** Keep in sync with `PUBLIC_ISR_REVALIDATE_SECONDS`. */
export const revalidate = 120;
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
  const startIdx = (page - 1) * PROGRAMS_PER_PAGE;
  const endIdx = startIdx + PROGRAMS_PER_PAGE - 1;
  const filterQuery =
    filter === "hasKeys" ? "count(cdKeys[]) > 0" : filter === "noKeys" ? "count(cdKeys[]) == 0" : "true";
  const searchFilter = searchTerm
    ? " && (title match $search || string::lower(pt::text(description)) match $search)"
    : "";
  const orderClause = groqProgramsOrderClause(sortBy);
  const countQuery = `count(*[_type == "program" && ${filterQuery}${searchFilter}])`;
  const keyCountQuery = `*[_type == "program" && ${filterQuery}${searchFilter}]{"keyCount": count(cdKeys[])}`;
  const listQuery = `*[_type == "program" && ${filterQuery}${searchFilter}] ${orderClause} [${startIdx}...${endIdx}] {${programsListingProjection}}`;
  const queryParams = searchTerm ? { search: `*${searchTerm.toLowerCase()}*` } : {};

  const [totalCount, keyCountRows, rawPrograms, bundleCounts, storeRow, featuredProgram] = await Promise.all([
    client.fetch<number>(countQuery, queryParams, { next: { tags: [TAG_PROGRAM_LISTINGS] } }),
    client.fetch<Array<{ keyCount?: number }>>(keyCountQuery, queryParams, { next: { tags: [TAG_PROGRAM_LISTINGS] } }),
    client.fetch<ProgramWithStats[]>(listQuery, queryParams, { next: { tags: [TAG_PROGRAM_LISTINGS] } }),
    getBundleCountsByProgram(),
    getCachedStoreDetailsDocument(),
    getFeaturedProgram()
  ]);

  const mergedPage = mergeProgramStats((rawPrograms ?? []) as ProgramWithStats[], bundleCounts);
  const programs = mergedPage.map(program => ({
    ...program,
    descriptionPlain: portableTextToPlainText(program.description)
  })) as ProgramWithStats[];

  const socialData: SocialData = {
    socialLinks: storeRow?.socialLinks ?? []
  };

  const totalKeys = (keyCountRows ?? []).reduce((sum, row) => sum + (row.keyCount ?? 0), 0);
  const jsonLd = generateProgramsPageJsonLd(programs, totalCount, resolveSiteBaseUrl(storeRow?.seo));

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="min-h-screen bg-[#0f1923]">
        <ProgramsHero totalCount={totalCount} totalKeys={totalKeys} />

        <section className="border-b border-[#2a475e] bg-[#16202d] py-8">
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
