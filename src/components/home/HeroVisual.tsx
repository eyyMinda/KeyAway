"use client";

import { FaKey, FaDownload, FaShieldAlt, FaCheckCircle } from "react-icons/fa";

export default function HeroVisual() {
  const handleScrollToPrograms = () => {
    document.querySelector("#popular-programs")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      onClick={handleScrollToPrograms}
      className="relative order-2 lg:order-1 cursor-pointer group"
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleScrollToPrograms();
        }
      }}
      aria-label="Scroll to programs">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-3xl transform rotate-3 group-hover:rotate-6 transition-transform duration-300"></div>
      <div className="absolute inset-0 bg-gradient-to-tl from-accent-500/10 to-primary-500/10 rounded-3xl transform -rotate-2 group-hover:-rotate-4 transition-transform duration-300"></div>

      {/* Main Visual Container */}
      <div className="relative bg-white/5 backdrop-blur-sm rounded-3xl p-8 lg:p-12 border border-white/10 group-hover:border-white/20 transition-all duration-300">
        {/* Floating Elements */}
        <div className="absolute top-4 right-4 w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center animate-pulse">
          <FaKey className="w-8 h-8 text-primary-400" />
        </div>

        <div className="absolute bottom-6 left-4 w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center animate-bounce">
          <FaCheckCircle className="w-6 h-6 text-green-400" />
        </div>

        <div
          className="absolute top-1/2 right-6 w-10 h-10 bg-accent-500/20 rounded-full flex items-center justify-center animate-pulse"
          style={{ animationDelay: "1s" }}>
          <FaShieldAlt className="w-5 h-5 text-accent-400" />
        </div>

        {/* Central Content */}
        <div className="text-center space-y-6">
          {/* Main Icon */}
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-2xl">
            <FaDownload className="w-12 h-12 text-white" />
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <FaKey className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-xs text-gray-300">CD Keys</p>
            </div>

            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <FaCheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-xs text-gray-300">Verified</p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="space-y-2 group-hover:scale-105 transition-transform duration-300">
            <div className="text-lg font-semibold text-white">Get Started</div>
            <div className="text-sm text-gray-300">Click to Browse Programs</div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-primary-400 rounded-full opacity-60"></div>
        <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-accent-400 rounded-full opacity-40"></div>
        <div className="absolute top-1/4 -left-1 w-3 h-3 bg-green-400 rounded-full opacity-50"></div>
      </div>
    </div>
  );
}
