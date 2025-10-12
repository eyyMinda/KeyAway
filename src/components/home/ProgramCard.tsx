import Link from "next/link";
import { IdealImage } from "@/src/components/general/IdealImage";
import { FaEye, FaDownload, FaKey } from "react-icons/fa";
import { ProgramCardProps } from "@/src/types/home";

export default function ProgramCard({ program, stats, badges, showStats = true }: ProgramCardProps) {
  return (
    <div className="group bg-white rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-200 hover:border-primary-400 animate-fade-in flex flex-col transform hover:-translate-y-2 relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary-50/30 before:to-transparent before:opacity-0 before:group-hover:opacity-100 before:transition-opacity before:duration-300">
      {/* Image Container */}
      <Link href={`/program/${program.slug.current}`} title={program.title} className="relative overflow-hidden">
        {program.image ? (
          <IdealImage
            image={program.image}
            alt={program.title}
            className="w-full h-36 sm:h-40 lg:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-36 sm:h-40 lg:h-48 bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
            <div className="text-neutral-400 text-3xl sm:text-4xl">💻</div>
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Subtle border overlay */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary-200/50 transition-colors duration-300 rounded-xl sm:rounded-2xl" />

        {/* Badges */}
        <div className="absolute top-2 sm:top-3 lg:top-4 left-2 sm:left-3 lg:left-4 flex flex-col gap-1.5 sm:gap-2">
          {badges?.mostViewed && (
            <div className="bg-blue-500 text-white px-2 sm:px-2.5 lg:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold flex items-center space-x-1">
              <FaEye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span className="hidden xs:inline">Most Viewed</span>
              <span className="xs:hidden">Top</span>
            </div>
          )}
          {badges?.mostDownloaded && (
            <div className="bg-green-500 text-white px-2 sm:px-2.5 lg:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold flex items-center space-x-1">
              <FaDownload className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span className="hidden xs:inline">Most Downloaded</span>
              <span className="xs:hidden">Top</span>
            </div>
          )}
        </div>

        {/* Key Count Badge */}
        {program.cdKeys?.length && (
          <div className="absolute top-2 sm:top-3 lg:top-4 right-2 sm:right-3 lg:right-4">
            <div className="bg-white/95 backdrop-blur-sm text-gray-800 px-2 sm:px-2.5 lg:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold flex items-center space-x-1 shadow-lg border border-gray-200">
              <FaKey className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary-600" />
              <span>{program.cdKeys.length}</span>
            </div>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="py-4 sm:py-5 lg:py-6 px-4 sm:px-5 flex flex-col flex-grow bg-gradient-to-b from-white to-gray-50/50">
        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2 group-hover:text-primary-700 transition-colors leading-tight">
          {program.title}
        </h2>

        <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3 sm:line-clamp-4 leading-relaxed">
          {program.description}
        </p>

        {/* Stats above CTA */}
        {showStats && (stats?.viewCount !== undefined || stats?.downloadCount !== undefined) && (
          <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs text-gray-500 mb-3 sm:mb-4 bg-gray-50/80 rounded-lg py-1.5 sm:py-2 px-2 sm:px-3">
            {stats?.viewCount !== undefined && (
              <div className="flex items-center space-x-1">
                <FaEye className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500" />
                <span className="font-medium">{stats.viewCount} views</span>
              </div>
            )}
            {stats?.downloadCount !== undefined && (
              <div className="flex items-center space-x-1">
                <FaDownload className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-500" />
                <span className="font-medium">{stats.downloadCount} downloads</span>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <Link
          href={`/program/${program.slug.current}`}
          className="inline-flex items-center justify-center w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 mt-auto relative overflow-hidden">
          <span className="relative z-10">View Keys</span>
          <svg
            className="ml-1.5 sm:ml-2 w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1 relative z-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {/* Button shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </Link>
      </div>

      {/* Decorative accent */}
      <div className="h-0.5 sm:h-1 bg-gradient-to-r from-primary-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}
