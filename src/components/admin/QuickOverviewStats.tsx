"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DashboardStats {
  newMessages: number;
  newSuggestions: number;
  totalPrograms: number;
  totalKeys: number;
  totalReports: number;
  recentReports: number;
}

const defaultStats: DashboardStats = {
  newMessages: 0,
  newSuggestions: 0,
  totalPrograms: 0,
  totalKeys: 0,
  totalReports: 0,
  recentReports: 0
};

function StatCard({
  title,
  value,
  subtitle,
  href,
  iconBg,
  icon
}: {
  title: string;
  value: string | number;
  subtitle: string;
  href?: string;
  iconBg: string;
  icon: string;
}) {
  const content = (
    <div
      className={`bg-white rounded-xl shadow-soft border border-gray-200 p-6 transition-shadow ${
        href ? "group-hover:shadow-lg" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-gray-900 text-3xl font-bold">{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBg}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
  if (href) {
    return <Link href={href} className="block group">{content}</Link>;
  }
  return content;
}

export default function QuickOverviewStats() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/admin/dashboard/counts")
      .then(res => res.json())
      .then(data => {
        const d = data?.data ?? data;
        setStats({
          newMessages: d?.newMessages ?? 0,
          newSuggestions: d?.newSuggestions ?? 0,
          totalPrograms: d?.totalPrograms ?? 0,
          totalKeys: d?.totalKeys ?? 0,
          totalReports: d?.totalReports ?? 0,
          recentReports: d?.recentReports ?? 0
        });
      })
      .catch(() => setStats(defaultStats))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-gray-100 rounded-xl p-6 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <StatCard
        title="Programs"
        value={stats.totalPrograms}
        subtitle={`${stats.totalKeys} CD keys total`}
        href="/admin/programs"
        iconBg="bg-green-100"
        icon="🎮"
      />
      <StatCard
        title="Key Reports"
        value={stats.totalReports}
        subtitle={`${stats.recentReports} in last 7 days`}
        href="/admin/key-reports"
        iconBg="bg-orange-100"
        icon="🔄"
      />
      <StatCard
        title="New Messages"
        value={stats.newMessages}
        subtitle="Awaiting response (60d)"
        href="/admin/messages"
        iconBg="bg-pink-100"
        icon="📬"
      />
      <StatCard
        title="Key Suggestions"
        value={stats.newSuggestions}
        subtitle="To review (60d)"
        href="/admin/key-suggestions"
        iconBg="bg-amber-100"
        icon="🔑"
      />
    </div>
  );
}
