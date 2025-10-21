"use client";

import { FaDownload, FaKey, FaShieldAlt } from "react-icons/fa";
import HeroVisual from "./HeroVisual";
import { ContactModalTrigger } from "@/src/components/contact";
import { FacebookGroupHeroPromo } from "@/src/components/social";
import { SocialData } from "@/src/types";

interface HeroSectionProps {
  socialData?: SocialData;
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

export default function HeroSection({ socialData }: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-12 sm:py-16 lg:py-20 xl:py-28">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
      <div className="relative max-w-[90rem] mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content */}
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-4 sm:space-y-5">
              <h1 className="max-w-xl text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                Free CD Keys for <span className="text-gradient-pro">Pro Software</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-300 leading-relaxed">
                Unlock premium features and pro versions of your favorite software with verified, working CD keys.
              </p>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-4 sm:gap-5">
              {heroFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div
                      className={`flex-shrink-0 w-11 h-11 ${feature.bgColor} rounded-lg flex items-center justify-center`}>
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

            {/* Contribution Notice */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-5">
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                <span className="font-semibold text-white">Community-powered:</span> Help grow our library! Suggest CD
                keys for any program—even ones not listed yet. After verification, they&apos;ll be available to
                everyone.
              </p>
            </div>

            {/* Primary CTA - Better mobile layout */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
              <ContactModalTrigger
                tab="suggest"
                className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 lg:px-10 lg:py-5 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-[1.03] shadow-2xl text-sm sm:text-base lg:text-lg cursor-pointer ring-2 ring-accent-400/50 hover:ring-accent-400/70">
                <FaKey className="mr-2 sm:mr-3 text-base sm:text-lg" />
                <span className="whitespace-nowrap">Suggest a CD Key</span>
              </ContactModalTrigger>

              <button
                onClick={() => {
                  document.querySelector("#how-it-works")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center justify-center px-4 py-3 sm:px-6 sm:py-4 border-2 border-gray-600 hover:border-gray-500 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base cursor-pointer">
                <span className="whitespace-nowrap">How It Works</span>
              </button>
            </div>
          </div>

          {/* Right Side - Visual and Facebook Promo */}
          <div className="flex flex-col gap-6">
            {/* Visual Element */}
            <div className="order-2 lg:order-1">
              <HeroVisual />
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
