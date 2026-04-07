/** @fileoverview Homepage: parallel Sanity fetch, bundle merge for popular programs, visitor welcome line, JSON-LD. */
import { client } from "@/src/sanity/lib/client";
import { popularProgramsByViewsQuery, siteStatsQuery, storeDetailsQuery, socialLinksQuery } from "@lib/sanity/queries";
import { getBundleCountsByProgram, mergeProgramStats } from "@/src/lib/analytics/eventsApi";
import type { ProgramWithStats } from "@/src/types/home";
import { generateHomePageMetadata } from "@/src/lib/seo/metadata";
import { generateHomePageJsonLd } from "@/src/lib/seo/jsonLd";
import JsonLd from "@/src/components/JsonLd";
import { getFeaturedProgram } from "@/src/lib/sanity/sanityActions";
import HeroSection from "@/src/components/home/HeroSection";
import FeaturesSection from "@/src/components/home/FeaturesSection";
import PopularProgramsSection from "@/src/components/home/PopularProgramsSection";
import FeaturedProgramSection from "@/src/components/home/FeaturedProgramSection";
import StatsSection from "@/src/components/home/StatsSection";
import CTASection from "@/src/components/home/CTASection";
import { SocialData } from "@/src/types";
import { headers } from "next/headers";
import { getVisitorContextForPublicPage } from "@/src/lib/visitors/serverVisitorContext";

export const revalidate = 60;

export async function generateMetadata() {
  return generateHomePageMetadata();
}

export default async function HomePage() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoISO = weekAgo.toISOString();

  const [rawPopularPrograms, bundleCounts, stats, storeData, socialLinks, featuredProgram] = await Promise.all([
    client.fetch(popularProgramsByViewsQuery, {}, { next: { tags: ["homepage"] } }),
    getBundleCountsByProgram(),
    client.fetch(siteStatsQuery, { weekAgo: weekAgoISO }, { next: { tags: ["homepage"] } }),
    client.fetch(storeDetailsQuery, {}, { next: { tags: ["homepage"] } }),
    client.fetch(socialLinksQuery),
    getFeaturedProgram()
  ]);

  const popularPrograms = mergeProgramStats((rawPopularPrograms ?? []) as ProgramWithStats[], bundleCounts)
    .sort((a, b) => (b.popularityScore ?? 0) - (a.popularityScore ?? 0))
    .slice(0, 6) as ProgramWithStats[];

  const socialData: SocialData = {
    socialLinks: socialLinks || []
  };

  const hdrs = await headers();
  const { visitorWelcomeLine, visitorHint } = await getVisitorContextForPublicPage(hdrs);

  // Generate JSON-LD for homepage
  const storeInfo = storeData?.[0] || { title: "KeyAway", description: "Free CD Keys for Premium Software" };
  const jsonLd = generateHomePageJsonLd(storeInfo);

  return (
    <>
      <JsonLd data={jsonLd} />
      <main>
        <HeroSection socialData={socialData} visitorWelcomeLine={visitorWelcomeLine} visitorHint={visitorHint} />
        <FeaturedProgramSection program={featuredProgram} />
        <PopularProgramsSection programs={popularPrograms} />
        <FeaturesSection />
        <StatsSection stats={stats} />
        <CTASection />
      </main>
    </>
  );
}
