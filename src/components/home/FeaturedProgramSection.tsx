"use client";

import Link from "next/link";
import { FaStar, FaCheckCircle, FaDownload } from "react-icons/fa";
import { IdealImage } from "@/src/components/general/IdealImage";

interface FeaturedProgramSectionProps {
  program: {
    _id: string;
    title: string;
    slug: { current: string };
    description: string;
    featuredDescription?: string;
    image?: { asset: { url?: string; _ref?: string } };
    downloadLink?: string;
    totalKeys: number;
    workingKeys: number;
    viewCount: number;
    downloadCount: number;
    showcaseGif?: { asset: { url?: string; _ref?: string } };
  } | null;
}

export default function FeaturedProgramSection({ program }: FeaturedProgramSectionProps) {
  if (!program) return null;

  // Use featuredDescription from program if available, otherwise use regular description
  const description = program.featuredDescription || program.description;
  const imageSource = program.showcaseGif || program.image;

  return (
    <section
      id="featured-program"
      className="py-8 sm:py-12 lg:py-16 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center space-x-2 bg-yellow-100 text-yellow-600 px-4 py-2 rounded-full text-sm font-semibold mb-3">
            <FaStar className="w-4 h-4" />
            <span>Featured Program</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3">
            This Week&apos;s Featured Program
          </h2>
        </div>

        {/* Main Content */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl border border-white/10 p-4 sm:p-6 lg:p-8">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Left Side - Image/Showcase */}
            <div className="relative order-2 lg:order-1">
              {imageSource ? (
                <div className="relative w-full h-80 sm:h-96 lg:h-[500px]">
                  <IdealImage
                    image={imageSource}
                    alt={program.title}
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="w-full h-80 sm:h-96 lg:h-[500px] bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-lg flex items-center justify-center border border-white/10">
                  <div className="text-neutral-500 text-6xl">💻</div>
                </div>
              )}
            </div>

            {/* Right Side - Content */}
            <div className="order-1 lg:order-2 flex flex-col justify-center">
              <div className="space-y-4 sm:space-y-5">
                {/* Title */}
                <div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3">{program.title}</h3>
                  <div className="text-sm sm:text-base text-gray-300 leading-relaxed space-y-3">
                    <p>{description}</p>
                    <p>
                      With {program.workingKeys} verified working CD keys available, you can unlock the full premium
                      features of this professional software at no cost. Our community has verified these keys, ensuring
                      you get access to all the advanced capabilities this program offers.
                    </p>
                  </div>
                </div>

                {/* Key Statistics */}
                <div className="bg-gradient-to-br from-primary-500/10 to-blue-500/10 rounded-lg p-4 border border-primary-500/20">
                  <ul className="space-y-2 text-sm sm:text-base text-gray-300">
                    <li className="flex items-start space-x-2">
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong className="text-white">{program.workingKeys}</strong> verified working keys available
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong className="text-white">{program.viewCount.toLocaleString()}</strong> users have viewed
                        this program
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong className="text-white">{program.downloadCount.toLocaleString()}</strong> downloads
                        completed
                      </span>
                    </li>
                  </ul>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/program/${program.slug.current}`}
                    className="inline-flex items-center justify-center bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 shadow-lg text-sm sm:text-base">
                    View All {program.workingKeys} Working Keys
                  </Link>
                  {program.downloadLink && (
                    <Link
                      href={program.downloadLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg border border-white/20 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-gray-800 text-sm sm:text-base">
                      <FaDownload className="mr-2" />
                      Download Program
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
