"use client";

import { Program } from "@/src/types";
import ProgramCard from "@/src/components/home/ProgramCard";

interface AllProgramsSectionProps {
  programs: Program[];
}

export default function AllProgramsSection({ programs }: AllProgramsSectionProps) {
  return (
    <section id="all-programs" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">All Available Programs</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Browse our complete collection of free software with verified license keys
          </p>
        </div>

        {/* Programs Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {programs.map((program: Program) => (
            <ProgramCard key={program.slug.current} program={program} />
          ))}
        </div>

        {/* Empty State */}
        {programs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Programs Available</h3>
            <p className="text-gray-600">Check back soon for new software programs and license keys.</p>
          </div>
        )}
      </div>
    </section>
  );
}
