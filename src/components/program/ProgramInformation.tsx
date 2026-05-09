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
    <div className="relative aspect-2/1 w-full overflow-hidden rounded-sm shadow-2xl ring-1 ring-[#2a475e] lg:aspect-3/2">
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
    <section className="bg-[#0f1923] py-6 sm:py-10">
      <div className="max-w-3xl lg:max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile: intro → image+FB → body. Desktop: left col image+FB (sticky), right col intro + body. */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-12 relative">
          <div className="space-y-4 sm:space-y-6 text-left lg:col-start-2 lg:row-start-1">
            {visitorHint ? (
              <div className="w-full pt-1">
                <VisitorTierHint hint={visitorHint} variant="feature" />
              </div>
            ) : null}

            <div>
              <h1 className="section-title h2 mb-3 max-w-[540px]">{formatProgramDisplayTitle(program)}</h1>
              <p className="text-base leading-relaxed text-[#8f98a0] sm:text-lg">{heroSubtitle}</p>
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
                className="text-sm text-[#c6d4df] [&_li]:text-[#c6d4df] [&_p]:leading-relaxed sm:text-base"
              />
            ) : null}

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center sm:justify-evenly items-center">
              {program.downloadLink && (
                <Link
                  href={program.downloadLink}
                  target="_blank"
                  rel="nofollow noopener"
                  onClick={() => {
                    trackEvent("download_click", {
                      programSlug: program.slug.current,
                      path: window.location.pathname
                    });
                  }}
                  className="inline-flex items-center rounded-sm border border-[#5c8529] bg-[#4c6b22] px-5 py-3 text-sm font-semibold text-[#c6d4df] transition-colors hover:bg-[#5c8529] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#66c0f4] focus:ring-offset-2 focus:ring-offset-[#0f1923] sm:text-base">
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
                  color: "text-[#66c0f4]",
                  hoverColor: "hover:border-[#4a90c4]"
                },
                {
                  value: workingKeys,
                  label: workingLabel,
                  color: "text-[#5ba32b]",
                  hoverColor: "hover:border-[#3d6e1c]"
                }
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`rounded-sm border border-[#2a475e] bg-[#1b2838] p-3 text-center ${stat.hoverColor} transition-all duration-300`}>
                  <div className={`text-2xl sm:text-3xl font-bold ${stat.color} mb-1 sm:mb-2`}>{stat.value}</div>
                  <div className="text-xs font-medium leading-tight text-[#8f98a0] sm:text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
