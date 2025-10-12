"use client";

import Link from "next/link";
import { FaGithub, FaHeart, FaCarrot, FaKey, FaArrowRight } from "react-icons/fa";
import { trackEvent } from "@/src/lib/trackEvent";

const supportOptions = [
  {
    icon: FaCarrot,
    title: "Buy Carrot Juice",
    description: "Support us with a refreshing donation",
    buttonText: "Buy Carrot Juice",
    buttonIcon: "🥕",
    href: "https://www.buymeacoffee.com/eyyMinda",
    bgColor: "bg-orange-500/20",
    iconColor: "text-orange-400",
    buttonColor: "bg-orange-500 hover:bg-orange-600",
    trackEvent: "buymeacoffee"
  },
  {
    icon: FaGithub,
    title: "Star on GitHub",
    description: "Show your support by starring our repository",
    buttonText: "Star on GitHub",
    buttonIcon: "⭐",
    href: "https://github.com/eyyMinda/keyaway",
    bgColor: "bg-gray-700",
    iconColor: "text-gray-300",
    buttonColor: "bg-gray-600 hover:bg-gray-500",
    trackEvent: "github keyaway"
  }
];

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

export default function CTASection() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gray-900 text-white">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6">
        <div className="text-center">
          {/* Main CTA */}
          <div className="max-w-4xl mx-auto mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Ready to Get Started?</h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed px-2">
              Join thousands of users who have already discovered premium software for free. Browse our collection, find
              what you need, and start using it today.
            </p>

            <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                href="/programs"
                className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base">
                Browse All Programs
                <FaArrowRight className="ml-2 text-sm" />
              </Link>
              <Link
                href="https://github.com/eyyMinda/keyaway"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackEvent("social_click", {
                    social: "github keyaway",
                    path: window.location.pathname
                  });
                }}
                className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 border-2 border-gray-600 hover:border-gray-500 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base">
                <FaGithub className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                View on GitHub
              </Link>
            </div>
          </div>

          {/* Support Section */}
          <div className="bg-gray-800 rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 xl:p-12 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                <FaHeart className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Love KeyAway? Fuel Our Mission with Carrot Juice! 🥕</h3>
              <p className="text-gray-300 text-lg">
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
                      <p className="text-gray-300 text-sm mb-4">{option.description}</p>
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
                        className={`inline-flex items-center ${option.buttonColor} text-white px-6 py-3 rounded-lg font-semibold transition-colors`}>
                        <span className="mr-2">{option.buttonIcon}</span>
                        {option.buttonText}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Additional Ways to Help */}
            <div className="mt-8 pt-8 border-t border-gray-700">
              <h4 className="text-lg font-semibold mb-6 text-center">Other Ways to Contribute</h4>
              <div className="grid sm:grid-cols-3 gap-6">
                {helpWays.map((way, index) => (
                  <div
                    key={index}
                    className="text-center p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors">
                    <div className={`w-3 h-3 ${way.color} rounded-full mx-auto mb-2`}></div>
                    <p className="font-semibold text-white mb-1">{way.text}</p>
                    <p className="text-xs text-gray-400">{way.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    const contactBtn = document.querySelector('[aria-label="Contact us"]') as HTMLButtonElement;
                    contactBtn?.click();
                  }}
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors">
                  <FaKey className="mr-2" />
                  Suggest a CD Key Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
