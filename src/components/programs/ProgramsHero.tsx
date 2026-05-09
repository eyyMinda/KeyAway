"use client";

import Image from "next/image";
import { FaKey } from "react-icons/fa";
import { ContactModalTrigger } from "@/src/components/contact";
import { HeroAtAGlanceStrip } from "@/src/components/home/HeroAtAGlanceStrip";
import { scrollToSectionWithHeaderOffset } from "@/src/lib/dom/scrollToSection";

interface ProgramsHeroProps {
  totalCount: number;
  totalKeys: number;
}

export default function ProgramsHero({ totalCount, totalKeys }: ProgramsHeroProps) {
  return (
    <section id="programs-hero" className="relative overflow-hidden border-b border-[#2a475e] bg-[#0f1923]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f1923_0%,#1b2838_55%,#16304a_100%)]" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_18px,rgba(102,192,244,0.06)_18px,rgba(102,192,244,0.06)_19px)] opacity-25" />

      <div className="relative z-10 mx-auto w-full max-w-360">
        <div className="flex min-h-0 flex-col gap-6 px-4 pb-8 pt-10 sm:gap-8 sm:px-6 sm:pb-10 sm:pt-12 lg:grid lg:grid-cols-2 lg:items-center lg:gap-x-8 lg:gap-y-0 lg:px-8 lg:pb-11 lg:pt-12 xl:gap-x-10">
          <div className="flex flex-col justify-center">
            <div className="mx-auto w-full max-w-2xl space-y-5 lg:mx-0">
              <div className="section-label">Programs</div>

              <h1 className="section-title">
                Discover free software <span className="text-gradient-pro">with working CD keys</span>
              </h1>

              <p className="text-base leading-relaxed text-[#8f98a0] sm:text-[17px] lg:max-w-md">
                Browse the catalog—community-tested keys, filters, and sorting so you can jump in fast.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <ContactModalTrigger
                  tab="suggest"
                  className="inline-flex cursor-pointer items-center justify-center rounded-sm border border-[#5c8529] bg-[#4c6b22] px-5 py-2.5 text-sm font-bold text-[#c6d4df] transition-colors hover:bg-[#5c8529] hover:text-white">
                  <FaKey className="mr-2 text-sm" />
                  Suggest a Key
                </ContactModalTrigger>
                <button
                  type="button"
                  onClick={() => scrollToSectionWithHeaderOffset("#programs-grid")}
                  className="inline-flex cursor-pointer items-center justify-center rounded-sm border border-[#4a90c4] px-5 py-2.5 text-sm font-semibold text-[#66c0f4] transition-colors hover:bg-[#1a3a5c]">
                  Browse program list
                </button>
              </div>

              <div className="max-w-sm overflow-hidden rounded-sm border border-[#2a475e]">
                <div className="grid grid-cols-2 gap-px bg-[#2a475e]">
                  <div className="bg-[#16202d] px-3 py-3 text-center sm:py-3.5">
                    <div className="text-xl font-bold leading-none text-white sm:text-2xl lg:text-3xl">
                      {totalCount.toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs font-medium text-[#8f98a0]">Programs</div>
                  </div>
                  <div className="bg-[#16202d] px-3 py-3 text-center sm:py-3.5">
                    <div className="text-xl font-bold leading-none text-[#5ba32b] sm:text-2xl lg:text-3xl">
                      {totalKeys.toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs font-medium text-[#8f98a0]">CD keys listed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full justify-center">
            <div className="relative aspect-5/3 w-full max-w-2xl overflow-hidden rounded-sm lg:max-w-none">
              <Image
                src="/images/Hero_laptop_software_icons.webp"
                alt="Software and activation keys"
                fill
                className="object-cover object-[56%_40%]"
                sizes="(max-width: 1023px) 90vw, (max-width: 1536px) 50vw, 560px"
                priority
              />
              <div
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,#1b2838_0%,transparent_28%)] opacity-45"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>

      <HeroAtAGlanceStrip stripId="programs-at-a-glance" navLabel="KeyAway highlights" />
    </section>
  );
}
