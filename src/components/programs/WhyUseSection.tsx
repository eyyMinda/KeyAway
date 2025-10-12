"use client";

import Link from "next/link";
import { FaCheckCircle, FaClock, FaUsers, FaLightbulb } from "react-icons/fa";

export default function WhyUseSection() {
  return (
    <section className="bg-white py-12 sm:py-16 lg:py-20">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">Why Use KeyAway?</h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Your go-to platform for finding, verifying, and sharing free CD keys—built and maintained by the community.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Easy Access */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
              <FaCheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Easy & Convenient</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Find CD keys for any program in one place. No hunting through forums or sketchy websites—everything you
              need is here.
            </p>
          </div>

          {/* Community Powered */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
              <FaUsers className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Community Powered</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Users verify key status, report expired ones, and suggest new keys. Together, we keep the platform
              accurate and growing.
            </p>
          </div>

          {/* Always Updated */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
              <FaClock className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Always Updated</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Real-time status updates from the community ensure you always know which keys are working, expired, or at
              limit.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 sm:mt-16 text-center bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl sm:rounded-3xl p-8 sm:p-10 lg:p-12 border border-primary-100">
          <FaLightbulb className="w-12 h-12 sm:w-16 sm:h-16 text-primary-600 mx-auto mb-4 sm:mb-6" />
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Join Our Community</h3>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed">
            Browse programs, grab working keys, report status updates, and suggest new keys. It&apos;s a community
            effort—and you&apos;re part of it!
          </p>
          <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg text-sm sm:text-base">
              Back to Home
            </Link>
            <button
              onClick={() => {
                const event = new CustomEvent("openContactModal", { detail: { tab: "contact" } });
                window.dispatchEvent(event);
              }}
              className="inline-flex items-center justify-center bg-white hover:bg-gray-50 text-gray-900 font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-gray-200 hover:border-primary-300 transition-all duration-300 text-sm sm:text-base cursor-pointer">
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
