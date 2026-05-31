import { Suspense } from "react";
import { generateProgramsPageMetadata } from "@/src/lib/seo/metadata";
import { generateProgramsPageJsonLd } from "@/src/lib/seo/jsonLd";
import { resolveSiteBaseUrl } from "@/src/lib/seo/storeSeoResolve";
import JsonLd from "@/src/components/JsonLd";
import ProgramsPageClient from "@/src/app/programs/ProgramsPageClient";
import { ProgramsHero, ContributeSection, WhyUseSection } from "@/src/components/programs";
import FeaturedProgramSection from "@/src/components/home/FeaturedProgramSection";
import { FacebookGroupButton } from "@/src/components/social";
import { getCachedStoreDetailsDocument } from "@/src/lib/sanity/getCachedStoreDetails";
import { getFeaturedProgram } from "@/src/lib/sanity/sanityActions";
import { getCachedProgramsForJsonLd, getCachedProgramsHeroTotals } from "@/src/lib/programs/getProgramsPageData";
import type { SocialData } from "@/src/types";
/** Must match `PUBLIC_ISR_REVALIDATE_SECONDS` in `@/src/lib/cache/constants` (Next.js requires a literal). */
export const revalidate = 43200;

export async function generateMetadata() {
  return await generateProgramsPageMetadata();
}

/** Static shell — list/filter/sort/pagination via cached `/api/v1/programs/list`. */
export default async function ProgramsPage() {
  const [storeRow, featuredProgram, heroTotals, jsonLdPrograms] = await Promise.all([
    getCachedStoreDetailsDocument(),
    getFeaturedProgram(),
    getCachedProgramsHeroTotals(),
    getCachedProgramsForJsonLd()
  ]);

  const socialData: SocialData = {
    socialLinks: storeRow?.socialLinks ?? []
  };

  const jsonLd = generateProgramsPageJsonLd(jsonLdPrograms, heroTotals.totalCount, resolveSiteBaseUrl(storeRow?.seo));

  return (
    <>
      <JsonLd data={jsonLd} />
      <ProgramsHero totalCount={heroTotals.totalCount} totalKeys={heroTotals.totalKeys} />

      <section className="border-b border-[#2a475e] bg-[#16202d] py-8">
        <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <FacebookGroupButton socialData={socialData} variant="outline" className="text-base" />
        </div>
      </section>

      <Suspense
        fallback={
          <div id="programs-grid" className="mx-auto max-w-360 px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm text-neutral-100">Loading programs…</p>
          </div>
        }>
        <ProgramsPageClient />
      </Suspense>

      <ContributeSection />
      <FeaturedProgramSection program={featuredProgram} />
      <WhyUseSection />
    </>
  );
}
