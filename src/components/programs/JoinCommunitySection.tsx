"use client";

import Link from "next/link";
import { FaLightbulb } from "react-icons/fa";
import { ContactModalTrigger } from "@/src/components/contact";

export default function JoinCommunitySection() {
  return (
    <section className="bg-white py-12 sm:py-16 lg:py-20">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl sm:rounded-3xl p-8 sm:p-10 lg:p-12 border border-primary-100">
          <FaLightbulb className="w-12 h-12 sm:w-16 sm:h-16 text-primary-600 mx-auto mb-4 sm:mb-6" />
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Join Our Community</h3>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed">
            Browse programs, grab working keys, report status updates, and suggest new keys. It&apos;s a community
            effort—and you&apos;re part of it!
          </p>
          <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg text-sm sm:text-base">
              Back to Home
            </Link>
            <ContactModalTrigger
              tab="contact"
              className="inline-flex items-center justify-center bg-white hover:bg-gray-50 text-gray-900 font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-gray-200 hover:border-primary-300 transition-all duration-300 text-sm sm:text-base cursor-pointer">
              Contact Us
            </ContactModalTrigger>
          </div>
        </div>
      </div>
    </section>
  );
}
