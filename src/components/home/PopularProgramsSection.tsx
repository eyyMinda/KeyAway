"use client";

import Link from "next/link";
import { Program } from "@/src/types";
import { FaFire, FaEye, FaDownload, FaKey } from "react-icons/fa";
import { IdealImage } from "@/src/components/general/IdealImage";

interface PopularProgramsSectionProps {
  programs: (Program & { viewCount: number; downloadCount: number })[];
}

export default function PopularProgramsSection({ programs }: PopularProgramsSectionProps) {
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.map((program, index) => (
            <div key={program.slug.current} className="group">
              <Link href={`/program/${program.slug.current}`}>
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 group-hover:border-primary-200">
                  {/* Image */}
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                    {program.image ? (
                      <IdealImage
                        image={program.image}
                        alt={program.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                          <FaDownload className="w-8 h-8 text-primary-600" />
                        </div>
                      </div>
                    )}

                    {/* Popular Badge */}
                    <div className="absolute top-4 left-4">
                      <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                        <FaFire className="w-3 h-3" />
                        <span>#{index + 1}</span>
                      </div>
                    </div>

                    {/* Download Count Badge */}
                    <div className="absolute top-4 right-4">
                      <div className="bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                        <FaDownload className="w-3 h-3" />
                        <span>{program.downloadCount || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {program.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">{program.description}</p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <FaEye className="w-4 h-4" />
                        <span>{program.viewCount || 0} views</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FaKey className="w-4 h-4" />
                        <span>{program.cdKeys?.length || 0} keys</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link
            href="#all-programs"
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
