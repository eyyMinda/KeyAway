import { client } from "@/src/sanity/lib/client";
import { popularProgramsByViewsQuery, siteStatsQuery, storeDetailsQuery, socialLinksQuery } from "@lib/queries";
import { getBundleCountsByProgram, mergeProgramStats } from "@/src/lib/eventsApi";
import type { ProgramWithStats } from "@/src/types/home";
import { generateHomePageMetadata } from "@/src/lib/metadata";
import { generateHomePageJsonLd } from "@/src/lib/jsonLd";
import JsonLd from "@/src/components/JsonLd";
import { getFeaturedProgram } from "@/src/lib/sanityActions";

// Import homepage sections
import HeroSection from "@/src/components/home/HeroSection";
import FeaturesSection from "@/src/components/home/FeaturesSection";
import PopularProgramsSection from "@/src/components/home/PopularProgramsSection";
import FeaturedProgramSection from "@/src/components/home/FeaturedProgramSection";
import StatsSection from "@/src/components/home/StatsSection";
import CTASection from "@/src/components/home/CTASection";
import { SocialData } from "@/src/types";

export const revalidate = 60;

export async function generateMetadata() {
  return generateHomePageMetadata();
}

export default async function HomePage() {
  // Calculate date one week ago
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoISO = weekAgo.toISOString();

  // Fetch all data in parallel for better performance
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

  // Generate JSON-LD for homepage
  const storeInfo = storeData?.[0] || { title: "KeyAway", description: "Free CD Keys for Premium Software" };
  const jsonLd = generateHomePageJsonLd(storeInfo);

  return (
    <>
      <JsonLd data={jsonLd} />
      <main>
        {/* Hero Section */}
        <HeroSection socialData={socialData} />

        {/* Featured Program Section */}
        <FeaturedProgramSection program={featuredProgram} />

        {/* Popular Programs Section */}
        <PopularProgramsSection programs={popularPrograms} />

        {/* Features Section */}
        <FeaturesSection />

        {/* Statistics Section */}
        <StatsSection stats={stats} />

        {/* Call-to-Action Section */}
        <CTASection />
      </main>
    </>
  );
}
