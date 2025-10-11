"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FaBell } from "react-icons/fa";
import { Notification } from "@/src/types/notifications";
import NotificationItem from "./NotificationItem";

interface AnnouncementNotificationsProps {
  notifications: Notification[];
}

export default function AnnouncementNotifications({ notifications }: AnnouncementNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMiniPopup, setShowMiniPopup] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const miniPopupTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to schedule mini popup appearance
  const scheduleMiniPopup = (delay: number) => {
    // Clear any existing timer
    if (miniPopupTimerRef.current) clearTimeout(miniPopupTimerRef.current);

    // Schedule new timer
    miniPopupTimerRef.current = setTimeout(() => {
      if (notifications.length > 0) setShowMiniPopup(true);
    }, delay);
  };

  // Show mini popup after 5 seconds on initial load
  useEffect(() => {
    scheduleMiniPopup(5000);

    return () => {
      if (miniPopupTimerRef.current) clearTimeout(miniPopupTimerRef.current);
    };
  }, [notifications.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.length;

  // Handle opening the dropdown
  const handleOpenDropdown = () => {
    setIsOpen(!isOpen);
    setShowMiniPopup(false); // Hide mini popup when opening dropdown

    // When closing the dropdown, schedule mini popup to appear after 2 minutes
    if (isOpen) {
      scheduleMiniPopup(120000); // 2 minutes
    }
  };

  // Handle clicking on the mini popup (hide it and reschedule)
  const handleMiniPopupClick = () => {
    setShowMiniPopup(false);
    scheduleMiniPopup(120000); // Reappear after 2 minutes
  };

  if (unreadCount === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={handleOpenDropdown}
        className="relative p-2 text-gray-300 hover:text-primary-500 transition-colors cursor-pointer focus:outline-none"
        aria-label="View announcements">
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Mini Popup - Appears after 5 seconds */}
      {showMiniPopup && !isOpen && (
        <div
          onClick={handleMiniPopupClick}
          className="absolute top-full right-0 mt-2 px-3 py-2 bg-primary-600 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap z-50"
          style={{ animation: "fadeIn 0.5s ease-out" }}>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
            <span>New updates available!</span>
          </div>
          {/* Small arrow pointer */}
          <div className="absolute -top-1 right-4 w-2 h-2 bg-primary-600 transform rotate-45 pointer-events-none"></div>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          className="fixed md:absolute right-2 md:right-0 mt-2 w-[calc(100vw-1rem)] md:w-80 max-w-sm bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden z-50 transition-all duration-200 ease-out"
          style={{
            animation: "slideDown 0.2s ease-out"
          }}>
          {/* Header */}
          <div className="px-4 py-3 bg-gray-750 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-white">Recent Announcements</h3>
          </div>

          {/* Notifications List - Shows ~2.8 notifications at once */}
          <div className="max-h-[240px] overflow-y-auto">
            {notifications.map(notification => (
              <NotificationItem key={notification.id} notification={notification} onClose={() => setIsOpen(false)} />
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-750 border-t border-gray-700">
            <Link
              href="/programs"
              onClick={() => setIsOpen(false)}
              className="text-xs text-primary-400 hover:text-primary-300 font-medium">
              View all programs →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
