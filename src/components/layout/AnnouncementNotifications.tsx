"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { FaBell } from "react-icons/fa";
import { Notification } from "@/src/types/notifications";
import NotificationItem from "./NotificationItem";
import { FacebookGroupButton } from "@/src/components/social";
import { usePathname } from "next/navigation";
import { SocialData } from "@/src/types";

interface AnnouncementNotificationsProps {
  notifications: Notification[];
  socialData?: SocialData;
}

export default function AnnouncementNotifications({ notifications, socialData }: AnnouncementNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMiniPopup, setShowMiniPopup] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const miniPopupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  const scheduleMiniPopup = useCallback(
    (delay: number) => {
      if (miniPopupTimerRef.current) clearTimeout(miniPopupTimerRef.current);

      miniPopupTimerRef.current = setTimeout(() => {
        if (notifications.length > 0) setShowMiniPopup(true);
      }, delay);
    },
    [notifications.length]
  );

  useEffect(() => {
    scheduleMiniPopup(5000);

    return () => {
      if (miniPopupTimerRef.current) clearTimeout(miniPopupTimerRef.current);
    };
  }, [notifications.length, scheduleMiniPopup]);

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

  const handleOpenDropdown = () => {
    setIsOpen(!isOpen);
    setShowMiniPopup(false);

    if (isOpen) {
      scheduleMiniPopup(120000);
    }
  };

  const handleMiniPopupClick = () => {
    setShowMiniPopup(false);
    scheduleMiniPopup(120000);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleOpenDropdown}
        className="relative cursor-pointer rounded-sm p-2 text-[#8f98a0] transition-colors hover:text-[#66c0f4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#16202d]"
        aria-label="View announcements"
        aria-expanded={isOpen}
        aria-haspopup="true">
        <FaBell size={20} aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-sm border border-[#4a90c4] bg-[#1a3a5c] px-1 text-[10px] font-bold leading-none text-[#c6d4df]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showMiniPopup && !isOpen && (
        <button
          type="button"
          onClick={handleMiniPopupClick}
          className="absolute right-0 top-full z-110 mt-2 cursor-pointer whitespace-nowrap rounded-sm border border-[#2a475e] bg-[#1b2838] px-3 py-2 text-left text-xs font-medium text-[#c6d4df] shadow-[0_8px_24px_rgba(0,0,0,0.55)] animate-[fadeIn_0.5s_ease-out]"
          aria-label="New announcements — open list">
          <span className="pointer-events-none absolute -top-1 right-4 h-2 w-2 rotate-45 border-l border-t border-[#2a475e] bg-[#1b2838]" aria-hidden />
          <span className="relative flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#5ba32b]" aria-hidden />
            <span>New updates available!</span>
          </span>
        </button>
      )}

      {isOpen && (
        <div
          className="fixed right-2 top-[calc(4.5rem+env(safe-area-inset-top,0))] z-110 w-[min(100vw-1rem,20rem)] overflow-hidden rounded-sm border border-[#2a475e] bg-[#1b2838] shadow-[0_12px_40px_rgba(0,0,0,0.75)] animate-[slideDown_0.2s_ease-out] md:absolute md:right-0 md:top-full md:mt-2 md:w-80"
          role="dialog"
          aria-label="Announcements">
          <div className="border-b border-[#2a475e] bg-[#16202d] px-4 py-3">
            <h3 className="text-sm font-semibold text-[#c6d4df]">
              Recent <span className="text-gradient-pro">Announcements</span>
            </h3>
            <p className="mt-0.5 text-xs text-[#8f98a0]">New programs and key drops</p>
          </div>

          <div className="max-h-[min(240px,50dvh)] overflow-y-auto overscroll-contain">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <NotificationItem key={notification.id} notification={notification} onClose={() => setIsOpen(false)} />
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="mb-1 text-sm text-[#8f98a0]">No recent announcements</p>
                <p className="text-xs text-[#556772]">Check back later for updates.</p>
              </div>
            )}

            {socialData ? (
              <div className="border-t border-[#2a475e] bg-[#16202d] p-3">
                <FacebookGroupButton
                  socialData={socialData}
                  path={pathname}
                  variant="outline"
                  taglinePlacement="inside"
                  className="text-xs"
                />
              </div>
            ) : null}
          </div>

          <div className="border-t border-[#2a475e] bg-[#16202d] px-4 py-2.5">
            <Link
              href="/programs"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-[#66d9ff] underline-offset-2 hover:text-white hover:underline">
              View all programs →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
