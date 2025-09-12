"use client";

import Link from "next/link";
import { FaGithub, FaHeart, FaCoffee } from "react-icons/fa";

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
              <h3 className="text-2xl font-bold mb-4">Love KeyAway? Support Our Mission</h3>
              <p className="text-gray-300 text-lg">
                Help us keep this project running and growing. Your support enables us to add more programs, improve the
                platform, and maintain our servers.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Buy Me a Coffee */}
              <div className="text-center">
                <div className="bg-yellow-500/20 rounded-2xl p-6 mb-4">
                  <FaCoffee className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold mb-2">Buy Me a Coffee</h4>
                  <p className="text-gray-300 text-sm mb-4">Support us with a one-time donation</p>
                  <Link
                    href="https://www.buymeacoffee.com/eyyMinda"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-semibold transition-colors">
                    <span className="mr-2">☕</span>
                    Buy Coffee
                  </Link>
                </div>
              </div>

              {/* GitHub Star */}
              <div className="text-center">
                <div className="bg-gray-700 rounded-2xl p-6 mb-4">
                  <FaGithub className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold mb-2">Star on GitHub</h4>
                  <p className="text-gray-300 text-sm mb-4">Show your support by starring our repository</p>
                  <Link
                    href="https://github.com/eyyMinda/keyaway"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-gray-600 hover:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                    <FaGithub className="mr-2 w-4 h-4" />
                    Star Project
                  </Link>
                </div>
              </div>
            </div>

            {/* Additional Ways to Help */}
            <div className="mt-8 pt-8 border-t border-gray-700">
              <h4 className="text-lg font-semibold mb-4">Other Ways to Help</h4>
              <div className="grid sm:grid-cols-3 gap-4 text-sm text-gray-300">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Report key status</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Share with friends</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Suggest new programs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
