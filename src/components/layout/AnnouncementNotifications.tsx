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
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  if (unreadCount === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-300 hover:text-primary-500 transition-colors cursor-pointer focus:outline-none"
        aria-label="View announcements">
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

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
