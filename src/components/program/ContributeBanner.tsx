"use client";

import { FaKey, FaExclamationCircle } from "react-icons/fa";

export default function ContributeBanner() {
  const handleSuggestKey = () => {
    const contactBtn = document.querySelector('[aria-label="Contact us"]') as HTMLButtonElement;
    contactBtn?.click();
  };

  return (
    <section className="py-8 sm:py-12 bg-gradient-to-br from-neutral-900 to-neutral-800">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-primary-600/20 to-blue-600/20 backdrop-blur-sm rounded-3xl border border-primary-500/30 p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Suggest Keys Section */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/20 rounded-2xl mb-4 lg:mb-6">
                <FaKey className="w-8 h-8 text-primary-400" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">Have More Keys to Share?</h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Know of other free CD keys for this or any other software? Share them with the community and help others
                unlock premium features!
              </p>
              <button
                onClick={handleSuggestKey}
                className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl cursor-pointer">
                <FaKey className="mr-2" />
                Suggest a CD Key
              </button>
            </div>

            {/* Report Keys Section */}
            <div className="text-center lg:text-left lg:border-l lg:border-white/10 lg:pl-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/20 rounded-2xl mb-4 lg:mb-6">
                <FaExclamationCircle className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">Found a Problem with a Key?</h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Help keep our database accurate by reporting keys that are expired, reached their limit, or are still
                working perfectly.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 text-sm">
                <div className="flex items-center px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-green-300 font-medium">Report Working</span>
                </div>
                <div className="flex items-center px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                  <span className="text-red-300 font-medium">Report Expired</span>
                </div>
                <div className="flex items-center px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                  <span className="text-yellow-300 font-medium">Report Limit</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
