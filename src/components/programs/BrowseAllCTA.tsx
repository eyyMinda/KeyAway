"use client";

import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";

export default function BrowseAllCTA() {
  return (
    <Link
      href="/programs"
      className="card-base group relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-sm border-dashed p-6 text-center">
      <div className="section-label mb-3">Programs</div>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-sm border border-[#4a90c4] bg-[#1a3a5c] transition-transform duration-300 group-hover:scale-110">
        <FaArrowRight className="h-8 w-8 text-[#c6d4df]" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-[#c6d4df] transition-colors group-hover:text-white sm:text-xl">
        Browse All Programs
      </h3>
      <p className="text-sm leading-relaxed text-[#8f98a0]">
        Explore our complete library of programs with advanced filters and search.
      </p>
      <div className="section-label-plain mt-4 group-hover:text-[#c6d4df]">View all →</div>
    </Link>
  );
}
