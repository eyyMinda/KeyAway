"use client";

import { FaDownload, FaKey, FaShieldAlt } from "react-icons/fa";
import { ContactModalTrigger } from "@/src/components/contact";
import { FacebookGroupHeroPromo } from "@/src/components/social";
import HeroLaptopImage from "./HeroLaptopImage";
import { SocialData } from "@/src/types";
import VisitorTierHint from "@/src/components/visitors/VisitorTierHint";
import type { VisitorHintData } from "@/src/lib/visitors/publicVisitorContext";
import { trackInteraction } from "@/src/lib/analytics/trackInteraction";
import { INTERACTION_IDS, SECTIONS } from "@/src/lib/analytics/interactionCatalog";
import { scrollToSectionWithHeaderOffset } from "@/src/lib/dom/scrollToSection";

interface HeroSectionProps {
  socialData?: SocialData;
  visitorHint?: VisitorHintData | null;
}

const heroFeatures = [
  {
    icon: FaKey,
    title: "Verified Keys",
    description: "Community tested",
    bgColor: "bg-primary-500/20",
    iconColor: "text-primary-400"
  },
  {
    icon: FaShieldAlt,
    title: "Safe & Secure",
    description: "100% legitimate",
    bgColor: "bg-green-500/20",
    iconColor: "text-green-400"
  },
  {
    icon: FaDownload,
    title: "Instant Access",
    description: "No waiting",
    bgColor: "bg-blue-500/20",
    iconColor: "text-blue-400"
  }
];

const HERO_IMAGE_SIZES = "(max-width: 1023px) 98vw, (max-width: 1450px) 48vw, 680px" as const;

export default function HeroSection({ socialData, visitorHint }: HeroSectionProps) {
  return (
    <section className="relative bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 text-white pt-12 sm:pt-16 lg:pt-20 xl:pt-28 pb-16 lg:pb-20">
      <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-gray-800 to-gray-900"></div>
      <div className="relative max-w-360 mx-auto px-4 sm:px-6">
        {/* Mobile: intro → image+FB → CTAs. Desktop: col1 intro + CTAs, col2 image+FB (row-span, sticky). */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-12">
          <div className="space-y-4 sm:space-y-6 lg:col-start-1 lg:row-start-1">
            {visitorHint ? (
              <div className="w-full pt-1">
                <VisitorTierHint hint={visitorHint} variant="feature" />
              </div>
            ) : null}

            <h1 className="max-w-xl text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Free CD Keys for <span className="text-gradient-pro">Pro Software</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
              Unlock premium features and pro versions of your favorite software with verified, working CD keys.
            </p>
          </div>

          <div className="flex w-full flex-col gap-6 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <HeroLaptopImage sizes={HERO_IMAGE_SIZES} priority />
            <FacebookGroupHeroPromo socialData={socialData} />
          </div>

          <div className="space-y-4 sm:space-y-6 lg:col-start-1 lg:row-start-2">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-0 lg:pt-2">
              <ContactModalTrigger
                tab="suggest"
                interactionId={INTERACTION_IDS.heroSuggestCdKey}
                sectionId={SECTIONS.home.hero}
                className="inline-flex items-center justify-center px-6 py-3 sm:px-6 bg-linear-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-[1.03] shadow-2xl text-sm sm:text-base cursor-pointer ring-2 ring-accent-400/50 hover:ring-accent-400/70">
                <FaKey className="mr-2 sm:mr-3 text-base sm:text-lg" />
                <span className="whitespace-nowrap">Suggest a CD Key</span>
              </ContactModalTrigger>

              <button
                onClick={() => {
                  void trackInteraction({
                    interactionId: INTERACTION_IDS.heroHowItWorks,
                    sectionId: SECTIONS.home.hero
                  });
                  scrollToSectionWithHeaderOffset("#how-it-works");
                }}
                className="inline-flex items-center justify-center px-4 py-3 sm:px-6 border-2 border-gray-600 hover:border-gray-500 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base cursor-pointer">
                <span className="whitespace-nowrap">How It Works</span>
              </button>
            </div>

            <figure className="m-0 w-full py-3 pl-0 pr-3 sm:pr-4">
              <blockquote className="m-0 border-none py-0 pl-0 pr-0">
                <div className="flex border-l-[3px] border-accent-400/70 pl-4">
                  <div className="min-w-0 pl-3">
                    <p className="font-serif text-sm italic leading-relaxed text-gray-200/95 sm:text-base">
                      Help grow our library—suggest CD keys for any program, even ones not listed yet. After
                      verification, they&apos;re available to everyone.
                    </p>
                    <cite className="mt-2 block text-xs font-medium tracking-wide text-gray-500 not-italic no-underline">
                      Community-powered
                    </cite>
                  </div>
                </div>
              </blockquote>
            </figure>

            <div className="flex flex-wrap gap-4 sm:gap-5 border-t border-white/10 pt-2">
              {heroFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div
                      className={`shrink-0 w-8 h-8 sm:w-11 sm:h-11 ${feature.bgColor} rounded-lg flex items-center justify-center`}>
                      <IconComponent className={`w-5 h-5 ${feature.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{feature.title}</h3>
                      <p className="text-xs text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
