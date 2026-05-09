"use client";

import Link from "next/link";
import { FaGithub, FaHeart, FaCarrot, FaKey, FaArrowRight } from "react-icons/fa";
import { trackEvent } from "@/src/lib/analytics/trackEvent";
import { ContactModalTrigger } from "@/src/components/contact";
import { StoreOtherLink } from "@/src/types";

const helpWays = [
  {
    text: "Report key status",
    color: "bg-green-400",
    description: "Let us know if keys work or expired"
  },
  {
    text: "Share with friends",
    color: "bg-blue-400",
    description: "Spread the word about free keys"
  },
  {
    text: "Suggest CD keys",
    color: "bg-purple-400",
    description: "Share keys for any software you find"
  }
];

export default function CTASection({ otherLinks }: { otherLinks: StoreOtherLink[] }) {
  const buyMeACoffeeUrl = otherLinks.find(link => link.kind === "buymeacoffee")?.url ?? "";
  const githubRepoUrl = otherLinks.find(link => link.kind === "githubRepository")?.url ?? "";

  const supportOptions =
    buyMeACoffeeUrl && githubRepoUrl
      ? [
          {
            icon: FaCarrot,
            title: "Buy Carrot Juice",
            description: "Support us with a refreshing donation",
            buttonText: "Buy Carrot Juice",
            buttonIcon: "🥕",
            href: buyMeACoffeeUrl,
            bgColor: "bg-orange-500/20",
            iconColor: "text-orange-300",
            buttonColor: "bg-orange-700 hover:bg-orange-800",
            trackEvent: "buymeacoffee"
          },
          {
            icon: FaGithub,
            title: "Star on GitHub",
            description: "Show your support by starring our repository",
            buttonText: "Star on GitHub",
            buttonIcon: "⭐",
            href: githubRepoUrl,
            bgColor: "bg-gray-700",
            iconColor: "text-gray-300",
            buttonColor: "bg-gray-600 hover:bg-gray-500",
            trackEvent: "github keyaway"
          }
        ]
      : [];

  return (
    <section className="bg-[#0f1923] py-12 text-[#c6d4df] sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-360 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Main CTA */}
          <div className="max-w-4xl mx-auto mb-10 sm:mb-12 lg:mb-16">
            <div className="section-label mb-3">Contribute</div>
            <h2 className="section-title mb-4 sm:mb-6">
              Ready to <span className="text-gradient-pro">Get Started?</span>
            </h2>
            <p className="mb-6 px-2 text-base leading-relaxed text-[#8f98a0] sm:mb-8 sm:text-lg lg:text-xl">
              Join thousands of users who have already discovered premium software for free. Browse our collection, find
              what you need, and start using it today.
            </p>

            <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                href="/programs"
                className="inline-flex items-center justify-center rounded-sm border border-[#5c8529] bg-[#4c6b22] px-6 py-3 text-sm font-semibold text-[#c6d4df] transition-colors hover:bg-[#5c8529] hover:text-white sm:px-8 sm:py-4 sm:text-base">
                Browse All Programs
                <FaArrowRight className="ml-2 text-sm" />
              </Link>
              <Link
                href={githubRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackEvent("social_click", {
                    social: "github keyaway",
                    path: window.location.pathname
                  });
                }}
                className="inline-flex items-center justify-center rounded-sm border border-[#4a90c4] px-6 py-3 text-sm font-semibold text-[#c6d4df] transition-colors hover:bg-[#1a3a5c] hover:text-white sm:px-8 sm:py-4 sm:text-base">
                <FaGithub className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                View on GitHub
              </Link>
            </div>
          </div>

          {/* Support Section */}
          <div className="card-base mx-auto max-w-4xl p-5 sm:p-6 lg:p-8 xl:p-12">
            <div className="text-center mb-8">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-sm bg-[#2a2020]">
                <FaHeart className="h-8 w-8 text-[#c94f4f]" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Love KeyAway? Fuel Our Mission with Carrot Juice! 🥕</h3>
              <p className="text-lg text-[#8f98a0]">
                Help us keep this project running and growing. Your support enables us to add more programs, improve the
                platform, and maintain our servers. Plus, it keeps us energized with fresh carrot juice!
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {supportOptions.map((option, index) => {
                const IconComponent = option.icon;
                return (
                  <div key={index} className="text-center">
                    <div className={`${option.bgColor} rounded-2xl p-6`}>
                      <IconComponent className={`w-12 h-12 ${option.iconColor} mx-auto mb-4`} />
                      <h4 className="text-xl font-semibold mb-2">{option.title}</h4>
                      <p className="mb-4 text-sm text-[#8f98a0]">{option.description}</p>
                      <Link
                        href={option.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          trackEvent("social_click", {
                            social: option.trackEvent,
                            path: window.location.pathname
                          });
                        }}
                        className={`inline-flex items-center rounded-sm px-6 py-3 font-semibold text-white transition-colors ${option.buttonColor}`}>
                        <span className="mr-2">{option.buttonIcon}</span>
                        {option.buttonText}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Additional Ways to Help */}
            <div className="mt-8 border-t border-[#2a475e] pt-8">
              <h4 className="text-lg font-semibold mb-6 text-center">Other Ways to Contribute</h4>
              <div className="grid sm:grid-cols-3 gap-6">
                {helpWays.map((way, index) => (
                  <div
                    key={index}
                    className="text-center rounded-sm border border-[#2a475e] bg-[#16202d] p-4 transition-colors hover:bg-[#213246]">
                    <div className={`w-3 h-3 ${way.color} rounded-full mx-auto mb-2`}></div>
                    <p className="mb-1 font-semibold text-[#c6d4df]">{way.text}</p>
                    <p className="text-xs text-[#8f98a0]">{way.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <ContactModalTrigger
                  tab="suggest"
                  className="inline-flex items-center justify-center rounded-sm border border-[#5c8529] bg-[#4c6b22] px-6 py-3 font-semibold text-[#c6d4df] transition-colors hover:bg-[#5c8529] hover:text-white">
                  <FaKey className="mr-2" />
                  Suggest a CD Key Now
                </ContactModalTrigger>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
