"use client";

import { FaCheckCircle, FaKey, FaHeart } from "react-icons/fa";
import { ContactModalTrigger } from "@/src/components/contact";

export default function ContributeSection() {
  return (
    <section className="border-t border-[#2a475e] bg-[#16202d] py-12 sm:py-16 lg:py-20">
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 sm:mb-12 lg:mb-16">
          <div className="section-label mb-3">Contribute</div>
          <h2 className="section-title mb-4 sm:mb-6">
            Help Us Grow the <span className="text-gradient-pro">Library</span>
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-[#8f98a0] sm:text-lg">
            Have free CD keys to share? Your contributions help thousands of users access premium software for free.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-10 sm:mb-12">
          {/* Share Keys */}
          <div className="card-base rounded-sm p-6 text-center sm:p-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-sm border border-[#4a90c4] bg-[#1a3a5c] sm:mb-6 sm:h-16 sm:w-16">
              <FaKey className="h-6 w-6 text-[#c6d4df] sm:h-7 sm:w-7" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-[#c6d4df] sm:mb-3 sm:text-xl">Share CD Keys</h3>
            <p className="text-sm leading-relaxed text-[#8f98a0] sm:text-base">
              Got working keys? Share them with the community and help others access premium software.
            </p>
          </div>

          {/* Report Status */}
          <div className="card-base rounded-sm p-6 text-center sm:p-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-sm border border-[#3d6e1c] bg-[#1a3a2a] sm:mb-6 sm:h-16 sm:w-16">
              <FaCheckCircle className="h-6 w-6 text-[#c6d4df] sm:h-7 sm:w-7" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-[#c6d4df] sm:mb-3 sm:text-xl">Report Key Status</h3>
            <p className="text-sm leading-relaxed text-[#8f98a0] sm:text-base">
              Found a key that doesn&apos;t work? Let us know so we can keep our database accurate and up-to-date.
            </p>
          </div>

          {/* Spread the Word */}
          <div className="card-base rounded-sm p-6 text-center sm:col-span-2 sm:p-8 lg:col-span-1">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-sm border border-[#5a4592] bg-[#2a2040] sm:mb-6 sm:h-16 sm:w-16">
              <FaHeart className="h-6 w-6 text-[#c6d4df] sm:h-7 sm:w-7" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-[#c6d4df] sm:mb-3 sm:text-xl">Spread the Word</h3>
            <p className="text-sm leading-relaxed text-[#8f98a0] sm:text-base">
              Love what we do? Share KeyAway with friends and on social media to help more people discover free
              software.
            </p>
          </div>
        </div>

        <div className="text-center">
          <ContactModalTrigger
            tab="suggest"
            className="inline-flex cursor-pointer items-center rounded-sm border border-[#5c8529] bg-[#4c6b22] px-6 py-3 text-sm font-semibold text-[#c6d4df] transition-colors hover:bg-[#5c8529] hover:text-white sm:px-8 sm:py-4 sm:text-base">
            <FaKey className="mr-2 sm:mr-3" />
            Suggest a CD Key Now
          </ContactModalTrigger>
        </div>
      </div>
    </section>
  );
}
