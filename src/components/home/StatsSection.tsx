"use client";

import { FaUsers, FaKey, FaChartLine, FaClock } from "react-icons/fa";

interface StatsSectionProps {
  stats: {
    totalPrograms: number;
    totalKeys: number;
    totalReports: number;
    recentReports: number;
  };
}

export default function StatsSection({ stats }: StatsSectionProps) {
  const statItems = [
    {
      icon: FaKey,
      value: stats.totalKeys,
      label: "Total License Keys",
      description: "Available for activation",
      color: "blue"
    },
    {
      icon: FaUsers,
      value: stats.totalPrograms,
      label: "Software Programs",
      description: "In our collection",
      color: "green"
    },
    {
      icon: FaChartLine,
      value: stats.totalReports,
      label: "Community Reports",
      description: "Key status updates",
      color: "purple"
    },
    {
      icon: FaClock,
      value: stats.recentReports,
      label: "Recent Reports",
      description: "This week",
      color: "orange"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-500/20 text-blue-600 border-blue-200",
      green: "bg-green-500/20 text-green-600 border-green-200",
      purple: "bg-purple-500/20 text-purple-600 border-purple-200",
      orange: "bg-orange-500/20 text-orange-600 border-orange-200"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-gray-800 via-sky-500 via-50% via-sky-800 via-80% to-gray-900 text-white">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Community Impact</h2>
          <p className="text-base sm:text-lg lg:text-xl text-blue-100 max-w-2xl mx-auto px-2 leading-relaxed">
            Our community-driven platform has helped thousands of users access premium software for free
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {statItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div key={index} className="text-center group">
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl sm:rounded-2xl border-2 ${getColorClasses(item.color)} mb-3 sm:mb-4 lg:mb-6 group-hover:scale-110 transition-transform`}>
                  <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight">
                    {item.value.toLocaleString()}
                  </div>
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-blue-100 leading-snug">
                    {item.label}
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-200 leading-tight">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-10 sm:mt-12 lg:mt-16 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Join Our Growing Community</h3>
            <p className="text-blue-100 text-sm sm:text-base lg:text-lg leading-relaxed mb-4 sm:mb-6 px-2">
              Every day, our community helps maintain the quality of our key database by reporting working, expired, or
              limit-reached keys. Your participation makes this platform better for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <div className="flex items-center space-x-2 text-blue-100">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm">Real-time updates</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-100">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm">Community verified</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-100">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-sm">Always free</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
