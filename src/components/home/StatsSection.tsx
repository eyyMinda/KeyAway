"use client";

import { FaDesktop, FaKey, FaChartLine, FaClock } from "react-icons/fa";

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
      icon: FaDesktop,
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
      blue: "bg-[#1a3a5c] text-[#66c0f4] border-[#4a90c4]",
      green: "bg-[#1a3a2a] text-[#5ba32b] border-[#3d6e1c]",
      purple: "bg-[#2a2040] text-[#7b5ea7] border-[#5a4592]",
      orange: "bg-[#3a2800] text-[#e8632a] border-[#a3421b]"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <section className="border-y border-[#2a475e] bg-[#1b2838] py-12 text-[#c6d4df] sm:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-360 px-4 sm:px-6 lg:px-8">
        {/* Header — unchanged hierarchy, slightly less air before the grid */}
        <div className="mb-6 sm:mb-8 lg:mb-9">
          <div className="section-label mb-3">Community Impact</div>
          <h2 className="section-title mb-3 sm:mb-4">
            Community <span className="text-gradient-pro">Impact</span>
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-[#8f98a0] sm:text-lg lg:text-xl">
            Our community-driven platform has helped thousands of users access premium software for free
          </p>
        </div>

        {/* Stats — dense panel + hairline gutters (Steam-ish) */}
        <div className="overflow-hidden rounded-sm border border-[#2a475e]">
          <div className="grid grid-cols-2 gap-px bg-[#2a475e] lg:grid-cols-4">
            {statItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={index}
                  className="group bg-[#16202d] px-3 py-3.5 text-center sm:px-4 sm:py-4 lg:px-3 lg:py-3.5">
                  <div
                    className={`mx-auto mb-2 inline-flex h-11 w-11 items-center justify-center rounded-sm border transition-transform group-hover:scale-105 sm:mb-2.5 sm:h-12 sm:w-12 ${getColorClasses(item.color)}`}>
                    <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <div className="text-xl font-bold leading-none text-white sm:text-2xl lg:text-3xl">
                      {item.value.toLocaleString()}
                    </div>
                    <h3 className="text-xs font-semibold leading-snug text-[#8f98a0] sm:text-sm">
                      {item.label}
                    </h3>
                    <p className="text-[11px] leading-tight text-[#556772] sm:text-xs">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Secondary blurb — tighter footprint */}
        <div className="mt-6 text-center sm:mt-8 lg:mt-9">
          <div className="mx-auto max-w-2xl rounded-sm border border-[#2a475e] bg-[#16202d] px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-5">
            <h3 className="mb-2 text-lg font-bold sm:text-xl">Join Our Growing Community</h3>
            <p className="mb-3 text-xs leading-relaxed text-[#8f98a0] sm:mb-4 sm:text-sm">
              Every day, our community helps maintain the quality of our key database by reporting working, expired, or
              limit-reached keys. Your participation makes this platform better for everyone.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-x-5">
              <div className="flex items-center gap-1.5 text-[#8f98a0]">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5ba32b]" />
                <span className="text-xs sm:text-sm">Real-time updates</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#8f98a0]">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#66c0f4]" />
                <span className="text-xs sm:text-sm">Community verified</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#8f98a0]">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#d4af37]" />
                <span className="text-xs sm:text-sm">Always free</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
