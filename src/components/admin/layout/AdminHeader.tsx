"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiChartBar, HiViewGrid } from "react-icons/hi";
import { MdRateReview, MdEventNote } from "react-icons/md";
import { FaKey, FaEnvelopeOpenText } from "react-icons/fa";
import { useKeyReportAlerts, KeyReportAlertsDesktop, KeyReportAlertsMobile } from "./KeyReportAlerts";

export default function AdminHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [newCounts, setNewCounts] = useState<{ newMessages: number; newSuggestions: number } | null>(null);
  const { alerts: keyReportAlerts } = useKeyReportAlerts();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/admin/new-counts")
      .then(res => res.json())
      .then(data => setNewCounts({ newMessages: data.newMessages ?? 0, newSuggestions: data.newSuggestions ?? 0 }))
      .catch(() => setNewCounts({ newMessages: 0, newSuggestions: 0 }));
  }, []);

  const isActive = (path: string) => pathname === path;

  const navLinks: Array<{ href: string; label: string; icon: typeof FaKey; countKey?: "suggestions" | "messages" }> = [
    { href: "/admin/analytics", label: "Analytics", icon: HiChartBar },
    { href: "/admin/programs", label: "Programs", icon: HiViewGrid },
    { href: "/admin/events", label: "Events", icon: MdEventNote },
    { href: "/admin/key-reports", label: "Key Reports", icon: MdRateReview },
    { href: "/admin/key-suggestions", label: "Key Suggestions", icon: FaKey, countKey: "suggestions" },
    { href: "/admin/messages", label: "Messages", icon: FaEnvelopeOpenText, countKey: "messages" }
  ];

  const getCount = (countKey: "suggestions" | "messages") =>
    newCounts ? (countKey === "suggestions" ? newCounts.newSuggestions : newCounts.newMessages) : 0;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <Link href="/admin" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">KeyAway Analytics</p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-lg font-bold text-gray-900">Admin</h1>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Icons Only */}
          <nav className="hidden md:flex items-center space-x-2">
            <KeyReportAlertsDesktop alerts={keyReportAlerts} />
            {navLinks.map(link => {
              const Icon = link.icon;
              const active = isActive(link.href);
              const count = link.countKey ? getCount(link.countKey) : 0;
              const showBadge = count > 0;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  className={`group relative p-2.5 rounded-md transition-colors ${
                    active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}>
                  <Icon size={20} />
                  {showBadge && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center bg-red-500 text-white text-xs font-semibold rounded-full">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                  <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <KeyReportAlertsMobile alerts={keyReportAlerts} onLinkClick={() => setIsMobileMenuOpen(false)} />
            <nav className="flex flex-col space-y-2">
              {navLinks.map(link => {
                const Icon = link.icon;
                const active = isActive(link.href);
                const count = link.countKey ? getCount(link.countKey) : 0;
                const showBadge = count > 0;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}>
                    <span className="relative shrink-0">
                      <Icon size={18} />
                      {showBadge && (
                        <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 flex items-center justify-center bg-red-500 text-white text-xs font-semibold rounded-full">
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
