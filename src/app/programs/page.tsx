import { generateProgramsPageMetadata } from "@/src/lib/seo/metadata";
import { generateProgramsPageJsonLd } from "@/src/lib/seo/jsonLd";
import ProgramsPageSocialShare from "@/src/components/social-share/ProgramsPageSocialShare";
import { getPageShareCounts } from "@/src/lib/share/getPageShareCounts";
import { resolveSiteBaseUrl, resolveDefaultOgImageUrl } from "@/src/lib/seo/storeSeoResolve";
import JsonLd from "@/src/components/JsonLd";
import { AdRails, AdSlot, BannerAd, NativeBannerAd } from "@/src/components/ads";
import ProgramsPageClient from "@/src/app/programs/ProgramsPageClient";
import { ProgramsHero, ContributeSection, WhyUseSection } from "@/src/components/programs";
import FeaturedProgramSection from "@/src/components/home/FeaturedProgramSection";
import { FacebookGroupButton } from "@/src/components/social";
import { getCachedStoreDetailsDocument } from "@/src/lib/sanity/getCachedStoreDetails";
import { getFeaturedProgram } from "@/src/lib/sanity/sanityActions";
import { getCachedVendorsWithCounts } from "@/src/lib/vendors/getVendors";
import {
  getCachedProgramCategoryOptions,
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

/**
 * Static shell with the default first page for crawlers. No `searchParams` here, so the page stays ISR;
 * the client reads the URL and loads filter/sort/pagination via cached `/api/v1/programs/list`.
 */
export default async function ProgramsPage() {
  const [
    storeRow,
    featuredProgram,
    heroTotals,
    jsonLdPrograms,
    initialListData,
    vendors,
    categoryOptions,
    shareCounts
  ] = await Promise.all([
    getCachedStoreDetailsDocument(),
    getFeaturedProgram(),
    getCachedProgramsHeroTotals(),
    getCachedProgramsForJsonLd(),
    getProgramsListData(undefined, undefined, undefined, undefined),
    getCachedVendorsWithCounts(),
    getCachedProgramCategoryOptions(),
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
      <AdRails />
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

      <AdSlot placement="programs-top" className="pt-6 sm:pt-8">
        <BannerAd />
      </AdSlot>
      <ProgramsPageClient initialListData={initialListData} vendors={vendors} categoryOptions={categoryOptions} />
      <AdSlot placement="programs-after-grid" className="pb-8 sm:pb-10">
        <BannerAd />
      </AdSlot>

      <ContributeSection />
      <FeaturedProgramSection program={featuredProgram} />
      <AdSlot placement="programs-after-featured" className="py-6">
        <NativeBannerAd />
      </AdSlot>
      <WhyUseSection />
    </>
  );
}
