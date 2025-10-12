"use client";

import { FaCheckCircle, FaKey, FaHeart } from "react-icons/fa";

export default function ContributeSection() {
  return (
    <section className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 py-12 sm:py-16 lg:py-20">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
            Help Us Grow the Library
          </h2>
          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Have free CD keys to share? Your contributions help thousands of users access premium software for free.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-10 sm:mb-12">
          {/* Share Keys */}
          <div className="bg-gradient-to-br from-primary-600/20 to-primary-700/10 backdrop-blur-sm border border-primary-400/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center hover:border-primary-400/50 hover:from-primary-600/30 hover:to-primary-700/20 transition-all duration-300">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-500/20 border border-primary-400/30 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <FaKey className="w-6 h-6 sm:w-7 sm:h-7 text-primary-300" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Share CD Keys</h3>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              Got working keys? Share them with the community and help others access premium software.
            </p>
          </div>

          {/* Report Status */}
          <div className="bg-gradient-to-br from-green-600/20 to-green-700/10 backdrop-blur-sm border border-green-400/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center hover:border-green-400/50 hover:from-green-600/30 hover:to-green-700/20 transition-all duration-300">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-500/20 border border-green-400/30 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <FaCheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-green-300" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Report Key Status</h3>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              Found a key that doesn&apos;t work? Let us know so we can keep our database accurate and up-to-date.
            </p>
          </div>

          {/* Spread the Word */}
          <div className="bg-gradient-to-br from-accent-600/20 to-accent-700/10 backdrop-blur-sm border border-accent-400/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center hover:border-accent-400/50 hover:from-accent-600/30 hover:to-accent-700/20 transition-all duration-300 sm:col-span-2 lg:col-span-1">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-accent-500/20 border border-accent-400/30 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <FaHeart className="w-6 h-6 sm:w-7 sm:h-7 text-accent-300" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Spread the Word</h3>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              Love what we do? Share KeyAway with friends and on social media to help more people discover free
              software.
            </p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              const event = new CustomEvent("openContactModal", { detail: { tab: "suggest" } });
              window.dispatchEvent(event);
            }}
            className="inline-flex items-center bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-[0_8px_30px_rgb(255,255,255,0.12)] hover:shadow-[0_12px_40px_rgb(255,255,255,0.2)] text-sm sm:text-base cursor-pointer">
            <FaKey className="mr-2 sm:mr-3" />
            Suggest a CD Key Now
          </button>
        </div>
      </div>
    </section>
  );
}
