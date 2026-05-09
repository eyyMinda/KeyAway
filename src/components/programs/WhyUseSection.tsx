"use client";

import { FaCheckCircle, FaClock, FaUsers } from "react-icons/fa";

export default function WhyUseSection() {
  return (
    <section className="border-t border-[#2a475e] bg-[#0f1923] py-12 sm:py-16 lg:py-20">
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 sm:mb-12 lg:mb-16">
          <div className="section-label mb-3">Why Use KeyAway</div>
          <h2 className="section-title mb-4 sm:mb-6">
            Why Use <span className="text-gradient-pro">KeyAway?</span>
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-[#8f98a0] sm:text-lg">
            Your go-to platform for finding, verifying, and sharing free CD keys—built and maintained by the community.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="card-base rounded-sm p-6 sm:p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm border border-[#3d6e1c] bg-[#1a3a2a] sm:mb-6 sm:h-14 sm:w-14">
              <FaCheckCircle className="h-6 w-6 text-[#c6d4df] sm:h-7 sm:w-7" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-[#c6d4df] sm:mb-3 sm:text-xl">Easy & Convenient</h3>
            <p className="text-sm leading-relaxed text-[#8f98a0] sm:text-base">
              Find CD keys for any program in one place. No hunting through forums or sketchy websites—everything you
              need is here.
            </p>
          </div>

          <div className="card-base rounded-sm p-6 sm:p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm border border-[#4a90c4] bg-[#1a3a5c] sm:mb-6 sm:h-14 sm:w-14">
              <FaUsers className="h-6 w-6 text-[#c6d4df] sm:h-7 sm:w-7" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-[#c6d4df] sm:mb-3 sm:text-xl">Community Powered</h3>
            <p className="text-sm leading-relaxed text-[#8f98a0] sm:text-base">
              Users verify key status, report expired ones, and suggest new keys. Together, we keep the platform
              accurate and growing.
            </p>
          </div>

          <div className="card-base rounded-sm p-6 sm:p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm border border-[#5a4592] bg-[#2a2040] sm:mb-6 sm:h-14 sm:w-14">
              <FaClock className="h-6 w-6 text-[#c6d4df] sm:h-7 sm:w-7" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-[#c6d4df] sm:mb-3 sm:text-xl">Always Updated</h3>
            <p className="text-sm leading-relaxed text-[#8f98a0] sm:text-base">
              Real-time status updates from the community ensure you always know which keys are working, expired, or at
              limit.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
