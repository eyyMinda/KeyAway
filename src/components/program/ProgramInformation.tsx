"use client";

import Link from "next/link";
import { FaDownload } from "react-icons/fa";
import { IdealImage } from "@/src/components/general/IdealImage";
import { Program, SocialData } from "@/src/types";
import { formatProgramDisplayTitle } from "@/src/lib/program/formatProgramDisplayTitle";
import { trackEvent } from "@/src/lib/analytics/trackEvent";
import { FacebookGroupHeroPromo } from "@/src/components/social";
import TrustpilotReviewWidget from "@/src/components/trustpilot/TrustpilotReviewWidget";
import { getTrustpilotReviewUrl, hasFacebookSocialLink } from "@/src/lib/social/socialUtils";
import VisitorTierHint from "@/src/components/visitors/VisitorTierHint";
import type { VisitorHintData } from "@/src/lib/visitors/publicVisitorContext";

interface ProgramInformationProps {
  program: Program;
  totalKeys: number;
  workingKeys: number;
  socialData?: SocialData;
  visitorHint?: VisitorHintData | null;
}

function ProgramInformationVisual({ program, variant }: { program: Program; variant: "mobile" | "desktop" }) {
  const mobile = variant === "mobile";
  const frameClass = mobile
    ? "relative w-full aspect-2/1 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10"
    : "relative w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10";

  return (
    <div>
      <div className={frameClass}>
        {program.image ? (
          <IdealImage
            image={program.image}
            alt={program.title}
            className={mobile ? "absolute inset-0 h-full w-full object-cover" : "w-full h-auto object-cover"}
            priority
          />
        ) : (
          <div
            className={
              mobile
                ? "absolute inset-0 flex items-center justify-center bg-linear-to-br from-primary-500/20 to-accent-500/20"
                : "flex h-80 w-full items-center justify-center rounded-2xl bg-linear-to-br from-primary-500/20 to-accent-500/20 border border-white/10"
            }>
            <div className="text-6xl text-neutral-500">💻</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProgramInformation({
  program,
  totalKeys,
  workingKeys,
  socialData,
  visitorHint
}: ProgramInformationProps) {
  const trustpilotUrl = getTrustpilotReviewUrl(socialData);
  const showTrustpilotFacebookRow = Boolean(trustpilotUrl) || hasFacebookSocialLink(socialData);
  return (
    <section className="bg-linear-to-b from-gray-900 via-gray-800 to-gray-900 py-6 sm:py-10">
      <div className="max-w-3xl lg:max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 relative">
          {/* Desktop: program image (left column) */}
          <div className="hidden lg:order-1 lg:flex flex-col gap-4 sticky top-20 h-fit">
            <ProgramInformationVisual program={program} variant="desktop" />
            <FacebookGroupHeroPromo socialData={socialData} />
          </div>

          {/* Content */}
          <div className="lg:order-2">
            <div className="space-y-4 sm:space-y-6 text-left">
              {visitorHint ? (
                <div className="w-full pt-1">
                  <VisitorTierHint hint={visitorHint} variant="feature" />
                </div>
              ) : null}

              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gradient-pro mb-3 leading-tight lg:max-w-[540px] mx-auto lg:mx-0">
                  {formatProgramDisplayTitle(program)}
                </h1>
                <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
                  Free giveaway CD keys for {program.title} — copy a working key and activate in the Windows app.
                </p>
                <div className="w-full flex flex-col gap-4 pt-3 lg:hidden">
                  <ProgramInformationVisual program={program} variant="mobile" />
                  <FacebookGroupHeroPromo socialData={socialData} />
                </div>
              </div>

              {program.description && (
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {program.description}
                </p>
              )}

              {/* Download Link and Facebook Group Button */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center sm:justify-evenly items-center">
                {program.downloadLink && (
                  <Link
                    href={program.downloadLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      trackEvent("download_click", {
                        programSlug: program.slug.current,
                        path: window.location.pathname
                      });
                    }}
                    className="inline-flex items-center bg-linear-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold px-5 py-4 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-neutral-800 shadow-lg text-sm sm:text-base">
                    <FaDownload size={18} className="mr-2 sm:mr-3" />
                    Download Program
                  </Link>
                )}
                {trustpilotUrl ? <TrustpilotReviewWidget reviewUrl={trustpilotUrl} /> : null}
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
