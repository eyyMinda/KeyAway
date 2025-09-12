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
    <section className="py-20 bg-gradient-to-br from-primary-600 to-blue-700 text-white">
      <div className="max-w-[90rem] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Community Impact</h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Our community-driven platform has helped thousands of users access premium software for free
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {statItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div key={index} className="text-center group">
                <div
                  className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl border-2 ${getColorClasses(item.color)} mb-6 group-hover:scale-110 transition-transform`}>
                  <IconComponent className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <div className="text-4xl lg:text-5xl font-bold text-white">{item.value.toLocaleString()}</div>
                  <h3 className="text-lg font-semibold text-blue-100">{item.label}</h3>
                  <p className="text-sm text-blue-200">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Join Our Growing Community</h3>
            <p className="text-blue-100 text-lg leading-relaxed mb-6">
              Every day, our community helps maintain the quality of our key database by reporting working, expired, or
              limit-reached keys. Your participation makes this platform better for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
