"use client";

import Link from "next/link";
import { Program } from "@/src/types";
import { FaFire } from "react-icons/fa";
import ProgramCard from "@/src/components/home/ProgramCard";

interface PopularProgramsSectionProps {
  programs: (Program & { viewCount: number; downloadCount: number })[];
}

export default function PopularProgramsSection({ programs }: PopularProgramsSectionProps) {
  // Find programs with highest stats for badges
  const maxViews = Math.max(...programs.map(p => p.viewCount), 0);
  const maxDownloads = Math.max(...programs.map(p => p.downloadCount), 0);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <FaFire className="w-4 h-4" />
            <span>Most Popular</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Most Popular Programs</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover the most popular software programs based on page views, downloads, and verified, working license
            keys
          </p>
        </div>

        {/* Programs Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {programs.map(program => (
            <ProgramCard
              key={program.slug.current}
              program={program}
              stats={{
                viewCount: program.viewCount,
                downloadCount: program.downloadCount
              }}
              badges={{
                mostViewed: program.viewCount === maxViews && maxViews > 0,
                mostDownloaded: program.downloadCount === maxDownloads && maxDownloads > 0
              }}
              showStats={true}
            />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link
            href="/programs"
            className="inline-flex items-center px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors">
            View All Programs
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
