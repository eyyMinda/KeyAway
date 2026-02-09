"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MdWarning } from "react-icons/md";
import type { KeyReportNotificationItem } from "@/src/types/admin";

export function useKeyReportAlerts() {
  const [alerts, setAlerts] = useState<KeyReportNotificationItem[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/key-report-notifications")
      .then(res => res.json())
      .then((data: KeyReportNotificationItem[]) => setAlerts(Array.isArray(data) ? data : []))
      .catch(() => setAlerts([]));
  }, []);

  return { alerts };
}

interface KeyReportAlertsDesktopProps {
  alerts: KeyReportNotificationItem[] | null;
}

export function KeyReportAlertsDesktop({ alerts }: KeyReportAlertsDesktopProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-expanded={dropdownOpen}
        aria-controls="key-report-alerts-dropdown"
        aria-label="Key report alerts"
        className={`relative p-2.5 rounded-md transition-colors cursor-pointer ${
          dropdownOpen ? "bg-amber-50 text-amber-600" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        }`}>
        <MdWarning size={20} />
        <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center bg-amber-500 text-white text-xs font-semibold rounded-full">
          {alerts.length > 99 ? "99+" : alerts.length}
        </span>
      </button>
      {dropdownOpen && (
        <div
          id="key-report-alerts-dropdown"
          className="absolute right-0 top-full mt-1 w-[380px] max-h-[70vh] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg z-50 py-2">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">Key report alerts (60d)</p>
            <p className="text-xs text-gray-500">Keys with negative reports needing attention</p>
          </div>
          <ul className="py-1">
            {alerts.map((item, i) => (
              <li key={`${item.programSlug}:${item.keyIdentifier}:${i}`} className="px-3 py-2 hover:bg-gray-50">
                <p className="text-sm font-medium text-gray-900 truncate">{item.programTitle}</p>
                <p className="text-xs font-mono text-gray-600 truncate">{item.keyIdentifier}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.negativeCount} negative · {item.ratioLabel}
                </p>
                <Link
                  href={item.link}
                  onClick={() => setDropdownOpen(false)}
                  className="inline-block mt-1.5 text-xs font-medium text-primary-600 hover:text-primary-700">
                  View →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface KeyReportAlertsMobileProps {
  alerts: KeyReportNotificationItem[] | null;
  onLinkClick?: () => void;
}

export function KeyReportAlertsMobile({ alerts, onLinkClick }: KeyReportAlertsMobileProps) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="px-3 pb-3 mb-3 border-b border-gray-200">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
        Key report alerts ({alerts.length})
      </p>
      <ul className="space-y-2 max-h-48 overflow-y-auto">
        {alerts.map((item, i) => (
          <li
            key={`${item.programSlug}:${item.keyIdentifier}:${i}`}
            className="rounded-md border border-gray-100 p-2 bg-gray-50">
            <p className="text-sm font-medium text-gray-900 truncate">{item.programTitle}</p>
            <p className="text-xs font-mono text-gray-600 truncate">{item.keyIdentifier}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {item.negativeCount} negative · {item.ratioLabel}
            </p>
            <Link
              href={item.link}
              onClick={onLinkClick}
              className="inline-block mt-1.5 text-xs font-medium text-primary-600 hover:text-primary-700">
              View →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
