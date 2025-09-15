"use client";

import { useState, useEffect, useRef } from "react";

export default function KeyStatusTooltip() {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={tooltipRef}>
      <button
        className="p-2 text-neutral-400 hover:text-neutral-200 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
      {/* Tooltip content */}
      <div
        className={`absolute bottom-full right-0 mb-2 px-4 py-3 bg-neutral-800 text-white text-sm rounded-lg shadow-lg transition-opacity duration-200 z-50 w-80 sm:w-80 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}>
        <div className="space-y-2">
          <div className="font-semibold text-white mb-2">Key Status Guide:</div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-primary-500 rounded-full"></span>
            <span>
              <strong>New:</strong> Fresh, unused keys
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-success-500 rounded-full"></span>
            <span>
              <strong>Active:</strong> Working and available
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-warning-500 rounded-full"></span>
            <span>
              <strong>Limit:</strong> Usage limit reached
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-error-500 rounded-full"></span>
            <span>
              <strong>Expired:</strong> Past validity date
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-neutral-600 text-xs text-neutral-300">
            Keys automatically expire based on their validity dates. Report non-working keys to help improve the system.
          </div>
        </div>
        {/* Arrow */}
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-800"></div>
      </div>
    </div>
  );
}
