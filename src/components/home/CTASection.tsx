"use client";

import Link from "next/link";
import { FaGithub, FaHeart, FaCarrot } from "react-icons/fa";

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
    buttonColor: "bg-orange-500 hover:bg-orange-600"
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
    buttonColor: "bg-gray-600 hover:bg-gray-500"
  }
];

const helpWays = [
  {
    text: "Report key status",
    color: "bg-green-400"
  },
  {
    text: "Share with friends",
    color: "bg-blue-400"
  },
  {
    text: "Suggest new programs",
    color: "bg-purple-400"
  }
];

export default function CTASection() {
  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="max-w-[90rem] mx-auto px-6">
        <div className="text-center">
          {/* Main CTA */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Join thousands of users who have already discovered premium software for free. Browse our collection, find
              what you need, and start using it today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/programs"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors">
                Browse All Programs
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="https://github.com/eyyMinda/keyaway"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-600 hover:border-gray-500 text-white font-semibold rounded-lg transition-colors">
                <FaGithub className="mr-2 w-5 h-5" />
                View on GitHub
              </Link>
            </div>
          </div>

          {/* Support Section */}
          <div className="bg-gray-800 rounded-2xl p-8 lg:p-12 max-w-4xl mx-auto">
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
                    <div className={`${option.bgColor} rounded-2xl p-6 mb-4`}>
                      <IconComponent className={`w-12 h-12 ${option.iconColor} mx-auto mb-4`} />
                      <h4 className="text-xl font-semibold mb-2">{option.title}</h4>
                      <p className="text-gray-300 text-sm mb-4">{option.description}</p>
                      <Link
                        href={option.href}
                        target="_blank"
                        rel="noopener noreferrer"
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
              <h4 className="text-lg font-semibold mb-4">Other Ways to Help</h4>
              <div className="grid sm:grid-cols-3 gap-4 text-sm text-gray-300">
                {helpWays.map((way, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className={`w-2 h-2 ${way.color} rounded-full`}></div>
                    <span>{way.text}</span>
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
