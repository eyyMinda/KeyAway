import { client } from "@/src/sanity/lib/client";
import { programsWithStatsQuery, programsCountQuery } from "@lib/queries";
import { generateProgramsPageMetadata } from "@/src/lib/metadata";
import { generateProgramsPageJsonLd } from "@/src/lib/jsonLd";
import JsonLd from "@/src/components/JsonLd";
import ProgramsPageClient from "@/src/app/programs/ProgramsPageClient";

export const revalidate = 60;

export async function generateMetadata() {
  return generateProgramsPageMetadata();
}

export default async function ProgramsPage() {
  // Fetch all programs with stats for client-side filtering
  const [programs, totalCount] = await Promise.all([
    client.fetch(programsWithStatsQuery, {}, { next: { tags: ["programs"] } }),
    client.fetch(programsCountQuery, {}, { next: { tags: ["programs"] } })
  ]);

  // Generate JSON-LD for programs page
  const jsonLd = generateProgramsPageJsonLd(programs, totalCount);

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-12 sm:py-16 lg:py-20 xl:py-24">
          <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                All Software Programs
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed">
                Browse our complete collection of {totalCount} software programs with verified CD keys. Find exactly
                what you need with our advanced filtering options.
              </p>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Community verified</span>
                </div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Real-time updates</span>
                </div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Always free</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Programs Grid with Filtering */}
        <ProgramsPageClient programs={programs} />
      </main>
    </>
  );
}
