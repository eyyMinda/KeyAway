/** @fileoverview Homepage: parallel Sanity fetch, bundle merge for popular programs, visitor hint, JSON-LD. */
import { client } from "@/src/sanity/lib/client";
import { programsWithStatsQuery, siteStatsQuery } from "@lib/sanity/queries";
import { getCachedStoreDetailsDocument } from "@/src/lib/sanity/getCachedStoreDetails";
import { mergeProgramStats } from "@/src/lib/analytics/eventsApi";
import { getSiteReportStats } from "@/src/lib/analytics/keyReportStore";
import type { ProgramWithStats } from "@/src/types/home";
import { generateHomePageMetadata } from "@/src/lib/seo/metadata";
import { generateHomePageJsonLd } from "@/src/lib/seo/jsonLd";
import { resolveHomePageSeo } from "@/src/lib/seo/storeSeoResolve";
import JsonLd from "@/src/components/JsonLd";
import { getFeaturedProgram } from "@/src/lib/sanity/sanityActions";
import { getCachedVendorsWithCounts } from "@/src/lib/vendors/getVendors";
import HeroSection from "@/src/components/home/HeroSection";
import FeaturesSection from "@/src/components/home/FeaturesSection";
import PopularProgramsSection from "@/src/components/home/PopularProgramsSection";
import FeaturedProgramSection from "@/src/components/home/FeaturedProgramSection";
import StatsSection from "@/src/components/home/StatsSection";
import CTASection from "@/src/components/home/CTASection";
import { AdSlot, BannerAd, NativeBannerAd } from "@/src/components/ads";
import { SocialData } from "@/src/types";
import { TAG_HOMEPAGE_PROGRAMS, TAG_HOMEPAGE_STATS } from "@/src/lib/cache/cacheTags";
/** Must match `PUBLIC_ISR_REVALIDATE_SECONDS` in `@/src/lib/cache/constants` (Next.js requires a literal). */
export const revalidate = 43200;

const HOMEPAGE_POPULAR_LIMIT = 9;

export async function generateMetadata() {
  return generateHomePageMetadata();
}

export default async function HomePage() {
  const [rawPopularPrograms, programStats, reportStats, store, featuredProgram, vendors] = await Promise.all([
    client.fetch(programsWithStatsQuery, {}, { next: { tags: [TAG_HOMEPAGE_PROGRAMS] } }),
    client.fetch(siteStatsQuery, {}, { next: { tags: [TAG_HOMEPAGE_STATS] } }),
    getSiteReportStats(),
    getCachedStoreDetailsDocument(),
    getFeaturedProgram(),
    getCachedVendorsWithCounts()
  ]);

  const stats = { ...programStats, ...reportStats };

  const popularPrograms = mergeProgramStats((rawPopularPrograms ?? []) as ProgramWithStats[])
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, HOMEPAGE_POPULAR_LIMIT) as ProgramWithStats[];

  const normalizedPopularPrograms = popularPrograms.map(program => ({
    ...program,
    descriptionPlain: typeof program.description === "string" ? program.description : undefined
  }));

  const socialData: SocialData = {
    socialLinks: store?.socialLinks ?? []
  };

  const homeSeo = resolveHomePageSeo(store);
  const jsonLd = generateHomePageJsonLd({
    title: store?.title?.trim() || homeSeo.storeTitle,
    description: homeSeo.description,
    siteUrl: homeSeo.siteUrl
  });

  return (
    <>
      <JsonLd data={jsonLd} />
      <HeroSection socialData={socialData} stats={stats} />
      <FeaturedProgramSection program={featuredProgram} />
      <AdSlot placement="home-after-featured" className="pt-6 sm:pt-8 lg:pt-10">
        <BannerAd />
      </AdSlot>
      <PopularProgramsSection programs={normalizedPopularPrograms} vendors={vendors} />
      <AdSlot placement="home-after-popular" className="pb-6">
        <BannerAd />
        <NativeBannerAd />
      </AdSlot>
      <FeaturesSection />
      <StatsSection stats={stats} />
      <AdSlot placement="home-before-cta" className="static-bg pt-6 sm:pt-8 lg:pt-10">
        <BannerAd />
      </AdSlot>
      <CTASection otherLinks={store?.otherLinks ?? []} />
    </>
  );
}
