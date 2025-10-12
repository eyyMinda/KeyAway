"use client";

import { FaPlus } from "react-icons/fa";

export default function SuggestKeyCTA() {
  return (
    <button
      onClick={() => {
        const event = new CustomEvent("openContactModal", { detail: { tab: "suggest" } });
        window.dispatchEvent(event);
      }}
      className="group relative bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 hover:border-primary-400 rounded-xl sm:rounded-2xl p-6 transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col items-center justify-center min-h-[280px] text-center">
      <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
        <FaPlus className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
        Suggest a CD Key
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed">
        Don&apos;t see what you&apos;re looking for? Share your CD key and help grow our library!
      </p>
      <div className="mt-4 text-xs font-semibold text-primary-600 group-hover:text-primary-700 uppercase tracking-wider">
        Click to Contribute
      </div>
    </button>
  );
}
