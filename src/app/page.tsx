import { client } from "@/src/sanity/lib/client";
import { popularProgramsByViewsQuery, siteStatsQuery } from "@lib/queries";
import { generateHomePageMetadata } from "@/src/lib/metadata";

// Import homepage sections
import HeroSection from "@/src/components/home/HeroSection";
import FeaturesSection from "@/src/components/home/FeaturesSection";
import PopularProgramsSection from "@/src/components/home/PopularProgramsSection";
import StatsSection from "@/src/components/home/StatsSection";
import CTASection from "@/src/components/home/CTASection";

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
  const [popularPrograms, stats] = await Promise.all([
    client.fetch(popularProgramsByViewsQuery, {}, { next: { tags: ["homepage"] } }),
    client.fetch(siteStatsQuery, { weekAgo: weekAgoISO }, { next: { tags: ["homepage"] } })
  ]);

  return (
    <main>
      {/* Hero Section */}
      <HeroSection />

      {/* Popular Programs Section */}
      <PopularProgramsSection programs={popularPrograms} />

      {/* Features Section */}
      <FeaturesSection />

      {/* Statistics Section */}
      <StatsSection stats={stats} />

      {/* Call-to-Action Section */}
      <CTASection />
    </main>
  );
}
