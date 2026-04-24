"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Notification } from "@/src/types/notifications";

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

function IconBadge({ isNewProgram, isFresh }: { isNewProgram: boolean; isFresh: boolean }) {
  return (
    <div
      className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
        isNewProgram ? "bg-blue-500/10 border border-blue-500/30" : "bg-green-500/10 border border-green-500/30"
      } ${isFresh ? "group-hover:scale-110" : ""}`}>
      {isNewProgram ? (
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
      )}
    </div>
  );
}

export default function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const isNewProgram = notification.type === "new_program" || notification.type === "new_program_with_keys";
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(notification.imageUrl) && !imageFailed;
  const message = notification.message?.trim() ?? "";

  const now = new Date();
  const createdAt = new Date(notification.createdAt);
  const daysOld = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  const isFresh = daysOld <= 14;
  const isRecent = daysOld > 14 && daysOld <= 31;

  const baseOpacity = isFresh ? "opacity-100" : isRecent ? "opacity-75" : "opacity-60";
  const borderStyle = isFresh ? "border-l-4 border-l-primary-500" : isRecent ? "border-l-2 border-l-primary-700" : "";

  return (
    <Link
      href={`/program/${notification.programSlug}`}
      onClick={onClose}
      className={`block px-4 py-3 hover:bg-gray-750/50 transition-all duration-200 border-b border-gray-700 last:border-b-0 group ${baseOpacity} ${borderStyle}`}>
      <div className="flex items-start gap-3">
        {showImage ? (
          <div
            className={`shrink-0 w-10 h-10 rounded-lg overflow-hidden ${
              isFresh ? "group-hover:scale-105 transition-transform" : ""
            }`}>
            <Image
              src={notification.imageUrl!}
              alt=""
              width={40}
              height={40}
              className="object-cover w-full h-full"
              sizes="40px"
              unoptimized
              onError={() => setImageFailed(true)}
            />
          </div>
        ) : (
          <IconBadge isNewProgram={isNewProgram} isFresh={isFresh} />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors truncate">
            {notification.programTitle}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-gray-400">
            {isNewProgram && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                NEW
              </span>
            )}
            {message ? <span>{message}</span> : null}
            <span className={isFresh ? "text-gray-400" : "text-gray-500"}>
              {createdAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric"
              })}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-gray-600 group-hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
