"use client";

import Link from "next/link";
import { IdealImage } from "@/src/components/general/IdealImage";
import { Program } from "@/src/types";
import { trackEvent } from "@/src/lib/trackEvent";

interface ProgramInformationProps {
  program: Program;
  totalKeys: number;
  workingKeys: number;
}

export default function ProgramInformation({ program, totalKeys, workingKeys }: ProgramInformationProps) {
  return (
    <div className="bg-neutral-800 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Image */}
          <div className="order-2 lg:order-1">
            {program.image ? (
              <div className="relative rounded-2xl overflow-hidden shadow-medium">
                <IdealImage image={program.image} alt={program.title} className="w-full max-h-96 object-contain" />
              </div>
            ) : (
              <div className="w-full h-80 bg-gradient-to-br from-primary-900 to-accent-900 rounded-2xl flex items-center justify-center shadow-medium">
                <div className="text-neutral-500 text-6xl">🎮</div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <h1 className="text-4xl font-bold text-white mb-4">{program.title} Free CD Keys</h1>
            <h2 className="text-xl text-primary-300 mb-4">
              Download premium software for free and activate one of the working license keys
            </h2>
            {program.description && (
              <p className="text-lg text-neutral-300 mb-6 leading-relaxed">{program.description}</p>
            )}

            {/* Download Link */}
            {program.downloadLink && (
              <div className="mb-6">
                <Link
                  href={program.downloadLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    trackEvent("download_click", { programSlug: program.slug.current, path: window.location.pathname })
                  }
                  className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-neutral-800">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download Program
                </Link>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-700 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-primary-400">{totalKeys}</div>
                <div className="text-sm text-neutral-300">Available CD Keys</div>
              </div>
              <div className="bg-neutral-700 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-success-400">{workingKeys}</div>
                <div className="text-sm text-neutral-300">Working License Keys</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
