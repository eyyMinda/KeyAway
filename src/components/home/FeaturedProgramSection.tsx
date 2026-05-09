"use client";

import Link from "next/link";
import { FaStar, FaCheckCircle, FaDownload } from "react-icons/fa";
import { IdealImage } from "@/src/components/general/IdealImage";
import { trackEvent } from "@/src/lib/analytics/trackEvent";
import type { PortableTextBlock } from "@portabletext/types";
import type { ProgramFeatured } from "@/src/types/program";
import RichText from "@/src/components/portableText/RichText";
import { portableTextHasContent } from "@/src/lib/portableText/toPlainText";

interface FeaturedProgramSectionProps {
  program: {
    _id: string;
    title: string;
    slug: { current: string };
    description: PortableTextBlock[] | string;
    featured?: ProgramFeatured;
    image?: { asset: { url?: string; _ref?: string } };
    downloadLink?: string;
    totalKeys: number;
    workingKeys: number;
    viewCount: number;
    downloadCount: number;
  } | null;
}

export default function FeaturedProgramSection({ program }: FeaturedProgramSectionProps) {
  if (!program) return null;

  const fd = program.featured?.description;
  const useFeatured = portableTextHasContent(fd ?? null);
  const introBody = useFeatured ? fd : program.description;
  const imageSource = program.featured?.showcaseGif || program.image;

  return (
    <section id="featured-program" className="border-y border-[#2a475e] bg-[#1b2838] py-8 sm:py-12 lg:py-16">
      <div className="max-w-360 mx-auto px-4 sm:px-6">
        <div className="mb-6 sm:mb-8">
          <div className="section-label mb-3 gap-2">
            <FaStar className="h-4 w-4 shrink-0 text-[#c6d4df]" aria-hidden />
            <span>Featured Program</span>
          </div>
          <h2 className="section-title mb-2 sm:mb-3">
            This Week&apos;s <span className="text-gradient-pro">Featured Program</span>
          </h2>
        </div>

        <div className="card-base p-4 sm:p-6 lg:p-8">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 relative">
            {/* Left Side - Image/Showcase */}
            <div className="lg:h-fit lg:sticky lg:top-24">
              {imageSource ? (
                <IdealImage
                  image={imageSource}
                  alt={program.title}
                  widthHint={960}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="rounded-sm object-contain"
                />
              ) : (
                <div className="flex h-80 w-full items-center justify-center rounded-sm border border-[#2a475e] bg-[#213246] sm:h-96 lg:h-[500px]">
                  <div className="text-neutral-500 text-6xl">💻</div>
                </div>
              )}
            </div>

            {/* Right Side - Content */}
            <div className="flex flex-col justify-center">
              <div className="space-y-4 sm:space-y-5">
                {/* Title */}
                <div>
                  <h3 className="mb-2 text-2xl font-bold text-[#c6d4df] sm:mb-3 lg:text-3xl">{program.title}</h3>
                  <div className="space-y-3 text-sm leading-relaxed text-[#c6d4df] sm:text-base">
                    <RichText value={introBody} className="[&_a]:text-[#66d9ff] [&_blockquote]:border-[#2a475e]" />
                    <p>
                      With {program.workingKeys} verified working CD keys available, you can unlock the full premium
                      features of this professional software at no cost. Our community has verified these keys, ensuring
                      you get access to all the advanced capabilities this program offers.
                    </p>
                  </div>
                </div>

                {/* Key Statistics */}
                <div className="rounded-sm border border-[#2a475e] bg-[#16202d] p-4">
                  <ul className="space-y-2 text-sm text-[#8f98a0] sm:text-base">
                    <li className="flex items-start space-x-2">
                      <FaCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#5ba32b] sm:h-5 sm:w-5" />
                      <span>
                        <strong className="text-[#c6d4df]">{program.workingKeys}</strong> verified working keys available
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <FaCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#5ba32b] sm:h-5 sm:w-5" />
                      <span>
                        <strong className="text-[#c6d4df]">{program.viewCount.toLocaleString()}</strong> users have viewed
                        this program
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <FaCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#5ba32b] sm:h-5 sm:w-5" />
                      <span>
                        <strong className="text-[#c6d4df]">{program.downloadCount.toLocaleString()}</strong> downloads
                        completed
                      </span>
                    </li>
                  </ul>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/program/${program.slug.current}`}
                    className="inline-flex items-center justify-center rounded-sm border border-[#5c8529] bg-[#4c6b22] px-5 py-2.5 text-sm font-semibold text-[#c6d4df] transition-colors hover:bg-[#5c8529] hover:text-white sm:px-6 sm:py-3 sm:text-base">
                    View All {program.workingKeys} Working Keys
                  </Link>
                  {program.downloadLink && (
                    <Link
                      href={program.downloadLink}
                      target="_blank"
                      rel="nofollow noopener"
                      onClick={() =>
                        trackEvent("download_click", {
                          programSlug: program.slug.current,
                          path: window.location.pathname
                        })
                      }
                      className="inline-flex items-center justify-center rounded-sm border border-[#4a90c4] px-5 py-2.5 text-sm font-semibold text-[#c6d4df] transition-colors hover:bg-[#1a3a5c] hover:text-white sm:px-6 sm:py-3 sm:text-base">
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
