"use client";

import { FaUsers, FaChartLine, FaShieldAlt, FaClock, FaCheckCircle, FaSearch, FaKey, FaClipboardList } from "react-icons/fa";
import { ContactModalTrigger } from "@/src/components/contact";

export default function FeaturesSection() {
  const features = [
    {
      icon: FaUsers,
      title: "Community-Driven",
      description:
        "Our community helps maintain key quality by reporting working, expired, or limit-reached keys in real-time.",
      color: "blue"
    },
    {
      icon: FaChartLine,
      title: "Real-Time Updates",
      description:
        "Key status updates instantly based on user reports, ensuring you always get the most current information.",
      color: "green"
    },
    {
      icon: FaShieldAlt,
      title: "Verified Sources",
      description:
        "All software and keys come from legitimate sources, ensuring safety and compliance with software terms.",
      color: "purple"
    },
    {
      icon: FaClock,
      title: "Always Available",
      description: "24/7 access to our database of free CD keys. No registration required, no hidden fees.",
      color: "orange"
    }
  ];

  const reportingSteps = [
    {
      step: "1",
      title: "Find a Key",
      description: "Browse our collection and find a software key you want to use",
      icon: FaSearch,
      color: "green"
    },
    {
      step: "2",
      title: "Test the Key",
      description: "Try activating the key with your software",
      icon: FaKey,
      color: "yellow"
    },
    {
      step: "3",
      title: "Report Status",
      description: "Let us know if the key worked, expired, or reached its limit",
      icon: FaClipboardList,
      color: "blue"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-[#1a3a5c] text-[#66c0f4] border-[#4a90c4]",
      green: "bg-[#1a3a2a] text-[#5ba32b] border-[#3d6e1c]",
      purple: "bg-[#2a2040] text-[#7b5ea7] border-[#5a4592]",
      orange: "bg-[#3a2800] text-[#e8632a] border-[#a3421b]",
      yellow: "bg-[#3a2800] text-[#f4a460] border-[#a3421b]"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <section id="how-it-works" className="border-t border-[#2a475e] bg-[#16202d] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-360 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12 lg:mb-16">
          <div className="section-label mb-3">How It Works</div>
          <h2 className="section-title mb-3">
            How <span className="text-gradient-pro">KeyAway Works</span>
          </h2>
          <p className="max-w-3xl px-2 text-base text-[#8f98a0] sm:text-lg lg:text-xl">
            We provide a community-driven platform for sharing and maintaining free CD keys. Our system ensures you
            always have access to working activation keys.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-10 sm:mb-14 lg:mb-20">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="group text-left">
                <div
                  className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-sm border ${getColorClasses(feature.color)} transition-transform group-hover:scale-110`}>
                  <IconComponent className="w-8 h-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#c6d4df]">{feature.title}</h3>
                <p className="leading-relaxed text-[#8f98a0]">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Key Reporting System */}
        <div className="card-base p-5 sm:p-6 lg:p-8 xl:p-12">
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <h3 className="mb-3 text-2xl font-bold text-[#c6d4df] sm:mb-4 lg:text-3xl">
              Community Key Reporting System
            </h3>
            <p className="mx-auto max-w-2xl px-2 text-sm text-[#8f98a0] sm:text-base lg:text-lg">
              Help maintain our database by reporting key status. Your feedback keeps our community informed and ensures
              everyone gets working keys.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {reportingSteps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="text-center relative">
                  <div
                    className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-sm border ${getColorClasses(step.color)}`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-[#213246] text-sm font-bold text-[#66c0f4]">
                      {step.step}
                    </div>
                    <h4 className="text-xl font-semibold text-[#c6d4df]">{step.title}</h4>
                  </div>
                  <p className="text-[#8f98a0]">{step.description}</p>
                </div>
              );
            })}
          </div>

          {/* Key Status Indicators */}
          <div className="mt-12 border-t border-[#2a475e] pt-8">
            <h4 className="mb-6 text-center text-lg font-semibold text-[#c6d4df]">Understanding Key Status</h4>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3 rounded-sm border border-[#3d6e1c] bg-[#1a3a2a] p-4">
                <div className="h-4 w-4 rounded-full bg-[#5ba32b]"></div>
                <div>
                  <h5 className="font-semibold text-[#c6d4df]">Working</h5>
                  <p className="text-sm text-[#8f98a0]">Key is active and functional</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 rounded-sm border border-[#6d2626] bg-[#2a2020] p-4">
                <div className="h-4 w-4 rounded-full bg-[#c94f4f]"></div>
                <div>
                  <h5 className="font-semibold text-[#c6d4df]">Expired</h5>
                  <p className="text-sm text-[#8f98a0]">Key is no longer valid</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 rounded-sm border border-[#a3421b] bg-[#3a2800] p-4">
                <div className="h-4 w-4 rounded-full bg-[#e8632a]"></div>
                <div>
                  <h5 className="font-semibold text-[#c6d4df]">Limit Reached</h5>
                  <p className="text-sm text-[#8f98a0]">Maximum activations exceeded</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contribution CTA */}
          <div className="mt-8 rounded-sm border border-[#2a475e] bg-[#16202d] p-5 pt-6 sm:mt-10 sm:p-6 sm:pt-8 lg:mt-12 lg:p-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-sm bg-[#213246] sm:mb-4 sm:h-14 sm:w-14">
                <FaUsers className="h-6 w-6 text-[#66c0f4] sm:h-7 sm:w-7" />
              </div>
              <h4 className="mb-3 text-2xl font-bold text-[#c6d4df]">Got Free CD Keys to Share?</h4>
              <p className="mb-5 px-2 text-sm leading-relaxed text-[#8f98a0] sm:mb-6 sm:text-base">
                Help grow our community database! If you have working CD keys for any software (not just IObit), share
                them with us. Together we can build the largest free software key repository.
              </p>
              <ContactModalTrigger
                tab="suggest"
                className="inline-flex items-center justify-center rounded-sm border border-[#5c8529] bg-[#4c6b22] px-5 py-2.5 text-sm font-semibold text-[#c6d4df] transition-colors hover:bg-[#5c8529] hover:text-white sm:px-6 sm:py-3 sm:text-base">
                <FaCheckCircle className="mr-2 text-sm sm:text-base" />
                Suggest a CD Key
              </ContactModalTrigger>
              <p className="mt-3 px-2 text-xs text-[#8f98a0] sm:mt-4 sm:text-sm">
                Every contribution helps users worldwide access premium software for free
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
