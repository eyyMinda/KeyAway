"use client";

import Link from "next/link";
import { FaDownload } from "react-icons/fa";
import { IdealImage } from "@/src/components/general/IdealImage";
import type { ProgramInformationProps } from "@/src/types/program";
import type { SocialData } from "@/src/types";
import type { Program } from "@/src/types/program";
import { formatProgramDisplayTitle } from "@/src/lib/program/formatProgramDisplayTitle";
import { trackEvent } from "@/src/lib/analytics/trackEvent";
import { FacebookGroupHeroPromo } from "@/src/components/social";
import TrustpilotReviewWidget from "@/src/components/trustpilot/TrustpilotReviewWidget";
import { getTrustpilotReviewUrl } from "@/src/lib/social/socialUtils";
import VisitorTierHint from "@/src/components/visitors/VisitorTierHint";
import type { VisitorHintData } from "@/src/lib/visitors/publicVisitorContext";
import RichText from "@/src/components/portableText/RichText";
import { portableTextHasContent } from "@/src/lib/portableText/toPlainText";
import { useI18n } from "@/src/contexts/i18n";

const PROGRAM_HERO_IMAGE_SIZES = "(max-width: 1023px) 98vw, (max-width: 1450px) 48vw, 680px" as const;

function ProgramHeroImage({ program }: { program: Program }) {
  return (
    <div className="relative aspect-2/1 w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 lg:aspect-3/2 lg:rounded-3xl">
      {program.image ? (
        <IdealImage
          image={program.image}
          alt={program.title}
          fill
          className="object-cover object-center"
          priority
          widthHint={960}
          sizes={PROGRAM_HERO_IMAGE_SIZES}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-primary-500/20 to-accent-500/20">
          <div className="text-6xl text-neutral-500">💻</div>
        </div>
      )}
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
  const { t } = useI18n("program");
  const trustpilotUrl = getTrustpilotReviewUrl(socialData);
  const heroSubtitle = t.hero.subtitle({ programTitle: program.title });
  const totalLabel = t.stats.totalLabel();
  const workingLabel = t.stats.workingLabel();

  return (
    <section className="bg-linear-to-b from-gray-900 via-gray-800 to-gray-900 py-6 sm:py-10">
      <div className="max-w-3xl lg:max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile: intro → image+FB → body. Desktop: left col image+FB (sticky), right col intro + body. */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-12 relative">
          <div className="space-y-4 sm:space-y-6 text-left lg:col-start-2 lg:row-start-1">
            {visitorHint ? (
              <div className="w-full pt-1">
                <VisitorTierHint hint={visitorHint} variant="feature" />
              </div>
            ) : null}

            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gradient-pro mb-3 leading-tight lg:max-w-[540px] mx-auto lg:mx-0">
                {formatProgramDisplayTitle(program)}
              </h1>
              <p className="text-base sm:text-lg text-gray-300 leading-relaxed">{heroSubtitle}</p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-4 lg:sticky lg:top-20 lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:h-fit">
            <ProgramHeroImage program={program} />
            <FacebookGroupHeroPromo socialData={socialData} />
          </div>

          <div className="space-y-4 sm:space-y-6 text-left lg:col-start-2 lg:row-start-2">
            {portableTextHasContent(program.description) ? (
              <RichText
                value={program.description}
                className="text-sm sm:text-base text-gray-300 [&_p]:leading-relaxed [&_li]:text-gray-300"
              />
            ) : null}

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

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              {[
                {
                  value: totalKeys,
                  label: totalLabel,
                  color: "text-primary-400",
                  hoverColor: "hover:border-primary-400/50"
                },
                {
                  value: workingKeys,
                  label: workingLabel,
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
    </section>
  );
}
