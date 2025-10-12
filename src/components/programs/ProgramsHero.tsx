"use client";

import { FaChevronDown } from "react-icons/fa";

interface ProgramsHeroProps {
  totalCount: number;
  totalKeys: number;
}

export default function ProgramsHero({ totalCount, totalKeys }: ProgramsHeroProps) {
  const handleScrollToGrid = () => {
    const gridSection = document.getElementById("programs-grid");
    gridSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      id="programs-hero"
      className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-12 sm:py-16 lg:py-20 xl:py-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 sm:px-5 py-2 mb-4 sm:mb-6">
            <span className="text-xs sm:text-sm font-semibold text-primary-300">
              {totalCount} Software Programs Available
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 lg:mb-5 leading-tight">
            Discover Free Software <br />
            <span className="text-gradient-pro">with Working CD Keys</span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-gray-300 max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed">
            Browse our complete collection of premium software programs with verified, community-tested CD keys. All
            free, always updated, and ready to activate.
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6 max-w-2xl mx-auto mb-6 sm:mb-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary-400 mb-1">{totalCount}</div>
              <div className="text-xs sm:text-sm text-gray-400 leading-tight">Programs</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-400 mb-1">{totalKeys}</div>
              <div className="text-xs sm:text-sm text-gray-400 leading-tight">Active Keys</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-400 mb-1">24/7</div>
              <div className="text-xs sm:text-sm text-gray-400 leading-tight">Updated</div>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-gray-300">Community Verified</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-gray-300">Real-Time Status</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span className="text-gray-300">100% Free</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={handleScrollToGrid}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce hidden lg:flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 transition-all duration-300 cursor-pointer group"
        aria-label="Scroll to programs">
        <FaChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
      </button>
    </section>
  );
}
