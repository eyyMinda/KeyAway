"use client";

import { FaDownload, FaKey, FaShieldAlt } from "react-icons/fa";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 lg:py-32">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">Free CD Keys & Software Licenses</h1>
              <p className="text-xl lg:text-2xl text-gray-300 leading-relaxed">
                Download premium software for free and activate one of our verified, working license keys
              </p>
            </div>

            {/* Features */}
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <FaKey className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Verified Keys</h3>
                  <p className="text-sm text-gray-400">Community tested</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <FaShieldAlt className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Safe & Secure</h3>
                  <p className="text-sm text-gray-400">100% legitimate</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <FaDownload className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Instant Access</h3>
                  <p className="text-sm text-gray-400">No waiting</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/programs"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors">
                Browse Programs
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-600 hover:border-gray-500 text-white font-semibold rounded-lg transition-colors">
                How It Works
              </Link>
            </div>
          </div>

          {/* Visual Element */}
          <div className="relative">
            <div className="bg-gradient-to-br from-primary-500/20 to-blue-500/20 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-white/20 rounded w-3/4"></div>
                  <div className="h-4 bg-white/20 rounded w-1/2"></div>
                  <div className="h-4 bg-white/20 rounded w-2/3"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-16 bg-white/10 rounded-lg"></div>
                  <div className="h-16 bg-white/10 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
