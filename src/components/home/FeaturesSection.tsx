"use client";

import { FaUsers, FaChartLine, FaShieldAlt, FaClock, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

export default function FeaturesSection() {
  const features = [
    {
      icon: FaUsers,
      title: "Community-Driven",
      description:
        "Our community helps maintain key quality by reporting working, expired, or limit-reached keys in real-time.",
      color: "blue"
    },
    {
      icon: FaChartLine,
      title: "Real-Time Updates",
      description:
        "Key status updates instantly based on user reports, ensuring you always get the most current information.",
      color: "green"
    },
    {
      icon: FaShieldAlt,
      title: "Verified Sources",
      description:
        "All software and keys come from legitimate sources, ensuring safety and compliance with software terms.",
      color: "purple"
    },
    {
      icon: FaClock,
      title: "Always Available",
      description: "24/7 access to our database of free CD keys. No registration required, no hidden fees.",
      color: "orange"
    }
  ];

  const reportingSteps = [
    {
      step: "1",
      title: "Find a Key",
      description: "Browse our collection and find a software key you want to use",
      icon: FaCheckCircle,
      color: "green"
    },
    {
      step: "2",
      title: "Test the Key",
      description: "Try activating the key with your software",
      icon: FaExclamationTriangle,
      color: "yellow"
    },
    {
      step: "3",
      title: "Report Status",
      description: "Let us know if the key worked, expired, or reached its limit",
      icon: FaUsers,
      color: "blue"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      green: "bg-green-500/20 text-green-400 border-green-500/30",
      purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-[90rem] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">How KeyAway Works</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We provide a community-driven platform for sharing and maintaining free CD keys. Our system ensures you
            always have access to working activation keys.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="text-center group">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl border-2 ${getColorClasses(feature.color)} mb-6 group-hover:scale-110 transition-transform`}>
                  <IconComponent className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Key Reporting System */}
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Community Key Reporting System</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Help maintain our database by reporting key status. Your feedback keeps our community informed and ensures
              everyone gets working keys.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {reportingSteps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="text-center relative">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-full border-2 ${getColorClasses(step.color)} mb-6`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {step.step}
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900">{step.title}</h4>
                  </div>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              );
            })}
          </div>

          {/* Key Status Indicators */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-6 text-center">Understanding Key Status</h4>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <div>
                  <h5 className="font-semibold text-gray-900">Working</h5>
                  <p className="text-sm text-gray-600">Key is active and functional</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <div>
                  <h5 className="font-semibold text-gray-900">Expired</h5>
                  <p className="text-sm text-gray-600">Key is no longer valid</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <div>
                  <h5 className="font-semibold text-gray-900">Limit Reached</h5>
                  <p className="text-sm text-gray-600">Maximum activations exceeded</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
