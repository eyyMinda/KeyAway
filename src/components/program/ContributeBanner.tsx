"use client";

import { FaKey, FaExclamationCircle } from "react-icons/fa";
import { ContactModalTrigger } from "@/src/components/contact";

export default function ContributeBanner() {
  return (
    <section className="py-6 sm:py-10 lg:py-12 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-primary-600/20 to-blue-600/20 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-primary-500/30 p-5 sm:p-6 lg:p-8 xl:p-12">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-center">
            {/* Suggest Keys Section */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-primary-500/20 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 lg:mb-6">
                <FaKey className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary-400" />
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-2 sm:mb-3">
                Have More Keys to Share?
              </h3>
              <p className="text-gray-300 text-sm sm:text-base lg:text-lg mb-4 sm:mb-5 lg:mb-6 leading-relaxed px-2">
                Know of other free CD keys for this or any other software? Share them with the community and help others
                unlock premium features!
              </p>
              <ContactModalTrigger
                tab="suggest"
                className="inline-flex items-center justify-center px-5 py-2.5 sm:px-6 sm:py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg sm:rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl cursor-pointer text-sm sm:text-base">
                <FaKey className="mr-2 text-sm" />
                Suggest a CD Key
              </ContactModalTrigger>
            </div>

            {/* Report Keys Section */}
            <div className="text-center lg:text-left lg:border-l lg:border-white/10 lg:pl-8 pt-6 lg:pt-0 border-t lg:border-t-0 border-white/10">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-amber-500/20 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 lg:mb-6">
                <FaExclamationCircle className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-amber-400" />
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-2 sm:mb-3">
                Found a Problem with a Key?
              </h3>
              <p className="text-gray-300 text-sm sm:text-base lg:text-lg mb-4 sm:mb-5 lg:mb-6 leading-relaxed px-2">
                Help keep our database accurate by reporting keys that are expired, reached their limit, or are still
                working perfectly.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3 text-xs sm:text-sm">
                <div className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full mr-1.5 sm:mr-2"></div>
                  <span className="text-green-300 font-medium whitespace-nowrap">Report Working</span>
                </div>
                <div className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-400 rounded-full mr-1.5 sm:mr-2"></div>
                  <span className="text-red-300 font-medium whitespace-nowrap">Report Expired</span>
                </div>
                <div className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full mr-1.5 sm:mr-2"></div>
                  <span className="text-yellow-300 font-medium whitespace-nowrap">Report Limit</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
