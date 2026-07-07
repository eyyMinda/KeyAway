import { Suspense } from "react";
import { generateProgramsPageMetadata } from "@/src/lib/seo/metadata";
import { generateProgramsPageJsonLd } from "@/src/lib/seo/jsonLd";
import ProgramsPageSocialShare from "@/src/components/social-share/ProgramsPageSocialShare";
import { getPageShareCounts } from "@/src/lib/share/getPageShareCounts";
import { resolveSiteBaseUrl, resolveDefaultOgImageUrl } from "@/src/lib/seo/storeSeoResolve";
import JsonLd from "@/src/components/JsonLd";
import ProgramsPageClient from "@/src/app/programs/ProgramsPageClient";
import { ProgramsHero, ContributeSection, WhyUseSection } from "@/src/components/programs";
import FeaturedProgramSection from "@/src/components/home/FeaturedProgramSection";
import { FacebookGroupButton } from "@/src/components/social";
import { getCachedStoreDetailsDocument } from "@/src/lib/sanity/getCachedStoreDetails";
import { getFeaturedProgram } from "@/src/lib/sanity/sanityActions";
import { getCachedVendorsWithCounts } from "@/src/lib/vendors/getVendors";
import {
  getCachedProgramsForJsonLd,
  getCachedProgramsHeroTotals,
  getProgramsListData
} from "@/src/lib/programs/getProgramsPageData";
import type { SocialData } from "@/src/types";
/** Must match `PUBLIC_ISR_REVALIDATE_SECONDS` in `@/src/lib/cache/constants` (Next.js requires a literal). */
export const revalidate = 43200;

export async function generateMetadata() {
  return await generateProgramsPageMetadata();
}

interface ProgramsPageProps {
  searchParams: Promise<{ search?: string; filter?: string; sort?: string; page?: string }>;
}

/** SSR first page for crawlers; client hydrates for filter/sort/pagination via cached `/api/v1/programs/list`. */
export default async function ProgramsPage({ searchParams }: ProgramsPageProps) {
  const sp = await searchParams;
  const [storeRow, featuredProgram, heroTotals, jsonLdPrograms, initialListData, vendors, shareCounts] =
    await Promise.all([
      getCachedStoreDetailsDocument(),
      getFeaturedProgram(),
      getCachedProgramsHeroTotals(),
      getCachedProgramsForJsonLd(),
      getProgramsListData(sp.search, sp.filter, sp.sort, sp.page),
      getCachedVendorsWithCounts(),
      getPageShareCounts("/programs")
    ]);

  const programsPageUrl = `${resolveSiteBaseUrl(storeRow?.seo)}/programs`;
  const programsShareImageUrl = resolveDefaultOgImageUrl(storeRow?.seo);

  const socialData: SocialData = {
    socialLinks: storeRow?.socialLinks ?? []
  };

  const jsonLd = generateProgramsPageJsonLd(jsonLdPrograms, heroTotals.totalCount, resolveSiteBaseUrl(storeRow?.seo));

  return (
    <>
      <JsonLd data={jsonLd} />
      <ProgramsHero totalCount={heroTotals.totalCount} totalKeys={heroTotals.totalKeys} />

      <section className="border-b border-[#2a475e] bg-[#16202d] py-8">
        <div className="mx-auto flex max-w-360 flex-col items-center gap-6 px-4 sm:px-6 lg:px-8">
          <ProgramsPageSocialShare
            pageUrl={programsPageUrl}
            programCount={heroTotals.totalCount}
            totalKeys={heroTotals.totalKeys}
            imageUrl={programsShareImageUrl}
            shareCounts={shareCounts}
          />
          <FacebookGroupButton socialData={socialData} variant="outline" className="text-base" />
        </div>
      </section>

      <Suspense
        fallback={
          <div id="programs-grid" className="mx-auto max-w-360 px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm text-neutral-100">Loading programs…</p>
          </div>
        }>
        <ProgramsPageClient initialListData={initialListData} vendors={vendors} />
      </Suspense>

      <ContributeSection />
      <FeaturedProgramSection program={featuredProgram} />
      <WhyUseSection />
    </>
  );
}
