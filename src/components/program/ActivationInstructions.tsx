"use client";

import { FaKey, FaDownload, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

export default function ActivationInstructions() {
  const steps = [
    {
      icon: FaDownload,
      title: "Download the Program",
      description: "Click the download button above to get the official software from the developer's website.",
      color: "text-blue-400",
      bgColor: "bg-blue-500/20"
    },
    {
      icon: FaKey,
      title: "Find the Activation Option",
      description: "Look for 'Enter a key', 'Already have a key', or 'Activate' option in the program interface.",
      color: "text-primary-400",
      bgColor: "bg-primary-500/20"
    },
    {
      icon: FaCheckCircle,
      title: "Copy & Paste CD Key",
      description: "Copy one of the working CD keys from the table below and paste it into the activation field.",
      color: "text-green-400",
      bgColor: "bg-green-500/20"
    }
  ];

  const tips = [
    {
      icon: FaExclamationTriangle,
      text: "Make sure to download from the official website, not third-party sources"
    },
    {
      icon: FaExclamationTriangle,
      text: "If a key doesn't work, try another one from the list"
    },
    {
      icon: FaExclamationTriangle,
      text: "Some programs may require internet connection for activation"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-neutral-800 to-neutral-900">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            How to Activate Your <span className="text-gradient-pro">Pro Software</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Follow these simple steps to unlock premium features with our verified CD keys
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center group">
              <div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${step.bgColor} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <step.icon className={`w-8 h-8 ${step.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
              <p className="text-gray-300 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="bg-neutral-700/50 rounded-2xl p-8 border border-neutral-600">
          <h3 className="text-xl font-semibold text-white mb-6 text-center">Important Tips</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {tips.map((tip, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center mt-0.5">
                  <tip.icon className="w-3 h-3 text-yellow-400" />
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
