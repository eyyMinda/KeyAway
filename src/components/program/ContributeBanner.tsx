"use client";

import type { ReactNode } from "react";
import { FaKey, FaExclamationCircle } from "react-icons/fa";
import { ContactModalTrigger } from "@/src/components/contact";

type ContributeSectionProps = {
  className?: string;
  iconContainerClassName: string;
  icon: ReactNode;
  title: string;
  description: string;
  content: ReactNode;
};

function ContributeSection({
  className = "",
  iconContainerClassName,
  icon,
  title,
  description,
  content
}: ContributeSectionProps) {
  return (
    <div className={`text-center lg:text-left ${className}`}>
      <div
        className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-sm sm:h-14 sm:w-14 lg:h-16 lg:w-16 ${iconContainerClassName}`}>
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold text-[#c6d4df] sm:mb-3 sm:text-xl lg:text-2xl xl:text-3xl">{title}</h3>
      <p className="mb-4 text-sm leading-relaxed text-[#8f98a0] sm:mb-5 sm:text-base lg:mb-6 lg:text-lg">
        {description}
      </p>
      {content}
    </div>
  );
}

export default function ContributeBanner() {
  return (
    <section className="border-t border-[#2a475e] bg-[#16202d] py-6 sm:py-10 lg:py-12">
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-sm border border-[#2a475e] bg-[#1b2838] p-5 sm:p-6 lg:p-8 xl:p-12">
          <div className="section-label mb-6">Community</div>
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 items-center">
            <ContributeSection
              iconContainerClassName="border border-[#4a90c4] bg-[#1a3a5c]"
              icon={<FaKey className="h-6 w-6 text-[#c6d4df] sm:h-7 sm:w-7 lg:h-8 lg:w-8" />}
              title="Have More Keys to Share?"
              description="Know of other free CD keys for this or any other software? Share them with the community and help others unlock premium features!"
              content={
                <ContactModalTrigger
                  tab="suggest"
                  className="inline-flex cursor-pointer items-center justify-center rounded-sm border border-[#5c8529] bg-[#4c6b22] px-5 py-2.5 text-sm font-semibold text-[#c6d4df] transition-colors hover:bg-[#5c8529] hover:text-white sm:px-6 sm:py-3 sm:text-base">
                  <FaKey className="mr-2 text-sm" />
                  Suggest a CD Key
                </ContactModalTrigger>
              }
            />

            <ContributeSection
              className="border-t border-[#2a475e] pt-6 md:border-t-0 md:border-l lg:border-[#2a475e] lg:pt-0 pl-4 sm:pl-6 lg:pl-8"
              iconContainerClassName="border border-[#a3421b] bg-[#3a2800]"
              icon={<FaExclamationCircle className="h-6 w-6 text-[#c6d4df] sm:h-7 sm:w-7 lg:h-8 lg:w-8" />}
              title="Found a Problem with a Key?"
              description="Help keep our database accurate by reporting keys that are expired, reached their limit, or are still working perfectly."
              content={
                <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="flex items-center rounded-sm border border-[#3d6e1c] bg-[#1a3a2a] px-3 py-1.5 sm:px-4 sm:py-2">
                    <div className="mr-1.5 h-1.5 w-1.5 rounded-full bg-[#5ba32b] sm:mr-2 sm:h-2 sm:w-2"></div>
                    <span className="whitespace-nowrap font-medium text-[#c6d4df]">Report Working</span>
                  </div>
                  <div className="flex items-center rounded-sm border border-[#6d2626] bg-[#2a2020] px-3 py-1.5 sm:px-4 sm:py-2">
                    <div className="mr-1.5 h-1.5 w-1.5 rounded-full bg-[#c94f4f] sm:mr-2 sm:h-2 sm:w-2"></div>
                    <span className="whitespace-nowrap font-medium text-[#c6d4df]">Report Expired</span>
                  </div>
                  <div className="flex items-center rounded-sm border border-[#a3421b] bg-[#3a2800] px-3 py-1.5 sm:px-4 sm:py-2">
                    <div className="mr-1.5 h-1.5 w-1.5 rounded-full bg-[#e8632a] sm:mr-2 sm:h-2 sm:w-2"></div>
                    <span className="whitespace-nowrap font-medium text-[#c6d4df]">Report Limit</span>
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}
