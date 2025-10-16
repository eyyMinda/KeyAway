"use client";

import { useState, useEffect, useRef } from "react";
import { FaInfoCircle } from "react-icons/fa";

export default function KeyStatusTooltip() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<"top" | "bottom">("top");
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate position and close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const calculatePosition = () => {
      if (buttonRef.current && isOpen) {
        const rect = buttonRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        // If there's more space below and it's at least 200px, show below, otherwise show above
        setPosition(spaceBelow >= 200 && spaceBelow > spaceAbove ? "bottom" : "top");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      calculatePosition();
      window.addEventListener("scroll", calculatePosition);
      window.addEventListener("resize", calculatePosition);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", calculatePosition);
      window.removeEventListener("resize", calculatePosition);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={tooltipRef}>
      <button
        ref={buttonRef}
        className="p-2 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}>
        <FaInfoCircle className="w-5 h-5" />
      </button>
      {/* Tooltip content */}
      <div
        className={`absolute right-0 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg transition-opacity duration-200 z-50 w-80 sm:w-80 border border-gray-600 ${
          position === "top" ? "bottom-full mb-2" : "top-full mt-2"
        } ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
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
          <div className="mt-3 pt-2 border-t border-gray-600 text-xs text-neutral-300">
            Keys automatically expire based on their validity dates. Report non-working keys to help improve the system.
          </div>
        </div>
        {/* Arrow */}
        <div
          className={`absolute right-4 w-0 h-0 border-l-4 border-r-4 ${
            position === "top"
              ? "top-full border-t-4 border-transparent border-t-gray-800"
              : "bottom-full border-b-4 border-transparent border-b-gray-800"
          }`}></div>
      </div>
    </div>
  );
}
