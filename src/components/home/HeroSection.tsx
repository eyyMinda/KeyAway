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

export default function HeroSection({ socialData, visitorHint }: HeroSectionProps) {
  return (
    <section className="relative bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-12 sm:py-16 lg:py-20 xl:py-28">
      <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-gray-800 to-gray-900"></div>
      <div className="relative max-w-360 mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Content */}
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-4">
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

              <div className="w-full pt-2 lg:hidden">
                <HeroLaptopImage variant="mobile" sizes="(max-width: 1023px) 100vw, 32px" />
              </div>
            </div>

            {/* Primary CTA - Better mobile layout */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
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

            {/* Pull-quote style community line */}
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

            {/* Features */}
            <div className="flex flex-wrap gap-4 sm:gap-5 border-t border-white/10 pt-2">
              {heroFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div
                      className={`shrink-0 w-11 h-11 ${feature.bgColor} rounded-lg flex items-center justify-center`}>
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

          {/* Right Side - Visual and Facebook Promo */}
          <div className="flex flex-col gap-6">
            <div className="relative order-2 hidden w-full lg:order-1 lg:block">
              <HeroLaptopImage variant="desktop" sizes="(max-width: 1023px) 32px, (max-width: 1536px) 50vw, 720px" />
            </div>

            {/* Facebook Group Promotion - Moved to right side */}
            <div className="order-1 lg:order-2">
              <FacebookGroupHeroPromo socialData={socialData} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
