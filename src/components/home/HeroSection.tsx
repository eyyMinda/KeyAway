"use client";

import { FaDownload, FaKey, FaShieldAlt, FaArrowRight } from "react-icons/fa";
import Link from "next/link";
import HeroVisual from "./HeroVisual";

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

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-12 sm:py-16 lg:py-24 xl:py-32">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative max-w-[90rem] mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                Free CD Keys for <span className="text-gradient-pro">Pro Software</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-gray-300 leading-relaxed">
                Unlock premium features and pro versions of your favorite software with our verified, working CD keys.
                <span className="block mt-2 text-sm sm:text-base lg:text-lg text-gray-400">
                  Community-driven platform where users report key status and share new keys
                </span>
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-4 sm:gap-6">
              {heroFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div
                      className={`flex-shrink-0 w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center`}>
                      <IconComponent className={`w-6 h-6 ${feature.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{feature.title}</h3>
                      <p className="text-sm text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col xs:flex-row gap-3 sm:gap-4">
              <Link
                href="#popular-programs"
                className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base">
                Browse Programs
                <FaArrowRight className="ml-2 text-sm" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 border-2 border-gray-600 hover:border-gray-500 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base">
                How It Works
              </Link>
            </div>
          </div>

          {/* Visual Element */}
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
