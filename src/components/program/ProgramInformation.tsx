"use client";

import Link from "next/link";
import { FaDownload } from "react-icons/fa";
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
    <section className="bg-gradient-to-br from-neutral-800 to-neutral-900 py-8 sm:py-12 lg:py-16">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Image */}
          <div className="order-2 lg:order-1">
            {program.image ? (
              <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
                <IdealImage image={program.image} alt={program.title} className="w-full max-h-96 object-contain" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ) : (
              <div className="w-full h-80 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-3xl flex items-center justify-center shadow-2xl border border-white/10">
                <div className="text-neutral-500 text-6xl">🎮</div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                  {program.title} <span className="text-gradient-pro">Free CD Keys</span>
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Download premium software for free and activate one of the working CD keys
                </p>
              </div>

              {program.description && <p className="text-lg text-gray-400 leading-relaxed">{program.description}</p>}

              {/* Download Link */}
              {program.downloadLink && (
                <div>
                  <Link
                    href={program.downloadLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      trackEvent("download_click", {
                        programSlug: program.slug.current,
                        path: window.location.pathname
                      })
                    }
                    className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-neutral-800 shadow-lg">
                    <FaDownload size={20} className="mr-3" />
                    Download Program
                  </Link>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10 hover:border-primary-400/50 transition-all duration-300">
                  <div className="text-3xl font-bold text-primary-400 mb-2">{totalKeys}</div>
                  <div className="text-sm text-gray-300 font-medium">Available CD Keys</div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10 hover:border-green-400/50 transition-all duration-300">
                  <div className="text-3xl font-bold text-green-400 mb-2">{workingKeys}</div>
                  <div className="text-sm text-gray-300 font-medium">Working Keys</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
