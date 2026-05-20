"use client";

import { FaPlus } from "react-icons/fa";
import { ContactModalTrigger } from "@/src/components/contact";

export default function SuggestKeyCTA() {
  return (
    <ContactModalTrigger
      tab="suggest"
      className="card-base group relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-sm border-dashed p-6 text-center">
      <div className="section-label mb-3">Contribute</div>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-sm border border-[#5c8529] bg-[#4c6b22] transition-transform duration-300 group-hover:scale-110">
        <FaPlus className="h-8 w-8 text-[#c6d4df]" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-[#c6d4df] transition-colors group-hover:text-white sm:text-xl">
        Suggest a CD Key
      </h3>
      <p className="text-sm leading-relaxed text-[#8f98a0]">
        Don&apos;t see what you&apos;re looking for? Share your CD key and help grow our library!
      </p>
      <div className="section-label-plain mt-4 group-hover:text-[#c6d4df]">Open form →</div>
    </ContactModalTrigger>
  );
}
