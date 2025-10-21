"use client";

import Link from "next/link";
import { FaDownload } from "react-icons/fa";
import { IdealImage } from "@/src/components/general/IdealImage";
import { Program, SocialData } from "@/src/types";
import { trackEvent } from "@/src/lib/trackEvent";
import { FacebookGroupButton } from "@/src/components/social";

interface ProgramInformationProps {
  program: Program;
  totalKeys: number;
  workingKeys: number;
  socialData?: SocialData;
}

export default function ProgramInformation({ program, totalKeys, workingKeys, socialData }: ProgramInformationProps) {
  return (
    <section className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-6 sm:py-10">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
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
            <div className="space-y-4 sm:space-y-6 text-center lg:text-left">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight lg:max-w-[540px] mx-auto lg:mx-0">
                  {program.title} <span className="text-gradient-pro">Free CD Keys</span>
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-gray-300 leading-relaxed">
                  Download premium software for free and activate one of the working CD keys
                </p>
              </div>

              {program.description && (
                <p className="text-sm sm:text-base lg:text-lg text-gray-400 leading-relaxed">{program.description}</p>
              )}

              {/* Download Link and Facebook Group Button */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center sm:justify-evenly items-center">
                {program.downloadLink && (
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
                    className="inline-flex items-center bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold px-5 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-neutral-800 shadow-lg text-sm sm:text-base">
                    <FaDownload size={18} className="mr-2 sm:mr-3" />
                    Download Program
                  </Link>
                )}
                <FacebookGroupButton socialData={socialData} variant="outline" className="text-sm sm:text-base" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                {[
                  {
                    value: totalKeys,
                    label: "Available CD Keys",
                    color: "text-primary-400",
                    hoverColor: "hover:border-primary-400/50"
                  },
                  {
                    value: workingKeys,
                    label: "Working Keys",
                    color: "text-green-400",
                    hoverColor: "hover:border-green-400/50"
                  }
                ].map((stat, index) => (
                  <div
                    key={index}
                    className={`bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 text-center border border-white/10 ${stat.hoverColor} transition-all duration-300`}>
                    <div className={`text-2xl sm:text-3xl font-bold ${stat.color} mb-1 sm:mb-2`}>{stat.value}</div>
                    <div className="text-xs sm:text-sm text-gray-300 font-medium leading-tight">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
