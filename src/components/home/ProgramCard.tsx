import Link from "next/link";
import { Program } from "@/src/types/ProgramType";
import { IdealImage } from "@/src/components/general/IdealImage";

export default function ProgramCard({ program }: { program: Program }) {
  return (
    <div className="group bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden border border-neutral-100 hover:border-primary-200 animate-fade-in">
      {/* Image Container */}
      <div className="relative overflow-hidden">
        {program.image ? (
          <IdealImage
            image={program.image}
            alt={program.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
            <div className="text-neutral-400 text-4xl">🎮</div>
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-6">
        <h2 className="text-xl font-bold text-neutral-900 mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors">
          {program.title}
        </h2>

        <p className="text-neutral-600 text-sm mb-4 line-clamp-3 leading-relaxed">{program.description}</p>

        {/* Action Button */}
        <Link
          href={`/program/${program.slug.current}`}
          className="inline-flex items-center justify-center w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
          <span>View Keys</span>
          <svg
            className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Decorative accent */}
      <div className="h-1 bg-gradient-to-r from-primary-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}
