import { generateProgramsPageMetadata } from "@/src/lib/seo/metadata";
import { generateProgramsPageJsonLd } from "@/src/lib/seo/jsonLd";
import { resolveSiteBaseUrl } from "@/src/lib/seo/storeSeoResolve";
import JsonLd from "@/src/components/JsonLd";
import ProgramsPageClient from "@/src/app/programs/ProgramsPageClient";
import { ProgramsHero, ContributeSection, WhyUseSection } from "@/src/components/programs";
import FeaturedProgramSection from "@/src/components/home/FeaturedProgramSection";
import { FacebookGroupButton } from "@/src/components/social";
import { getProgramsPageData } from "@/src/lib/programs/getProgramsPageData";
import type { SocialData } from "@/src/types";
import type { FilterType, SortType } from "@/src/types/programs";

/** Keep in sync with `PUBLIC_ISR_REVALIDATE_SECONDS`. */
export const revalidate = 300;

export async function generateMetadata() {
  return await generateProgramsPageMetadata();
}

export default async function ProgramsPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string; filter?: FilterType; sort?: SortType; page?: string }>;
}) {
  const params = await searchParams;
  const {
    programs,
    totalCount,
    totalKeys,
    searchTerm,
    filter,
    sortBy,
    page,
    programsPerPage,
    storeRow,
    featuredProgram
  } = await getProgramsPageData(params.search, params.filter, params.sort, params.page);

  const socialData: SocialData = {
    socialLinks: storeRow?.socialLinks ?? []
  };

  const jsonLd = generateProgramsPageJsonLd(programs, totalCount, resolveSiteBaseUrl(storeRow?.seo));

  return (
    <>
      <JsonLd data={jsonLd} />
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
        programsPerPage={programsPerPage}
      />

      <ContributeSection />
      <FeaturedProgramSection program={featuredProgram} />
      <WhyUseSection />
    </>
  );
}
