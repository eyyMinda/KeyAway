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
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border transition-all ${
        isNewProgram
          ? "border-[#4a90c4] bg-[#1a3a5c]"
          : "border-[#3d6e1c] bg-[#1a3a2a]"
      } ${isFresh ? "group-hover:scale-105" : ""}`}>
      {isNewProgram ? (
        <svg className="h-5 w-5 text-[#66c0f4]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ) : (
        <svg className="h-5 w-5 text-[#5ba32b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
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

  const baseOpacity = isFresh ? "opacity-100" : isRecent ? "opacity-90" : "opacity-70";
  const borderStyle = isFresh
    ? "border-l-4 border-l-[#66c0f4]"
    : isRecent
      ? "border-l-2 border-l-[#4a90c4]"
      : "border-l border-l-[#2a475e]";

  return (
    <Link
      href={`/program/${notification.programSlug}`}
      onClick={onClose}
      className={`group block border-b border-[#2a475e] px-4 py-3 transition-colors duration-200 last:border-b-0 hover:bg-[#213246] ${baseOpacity} ${borderStyle}`}>
      <div className="flex items-start gap-3">
        {showImage ? (
          <div
            className={`h-10 w-10 shrink-0 overflow-hidden rounded-sm border border-[#2a475e] ${
              isFresh ? "transition-transform group-hover:scale-105" : ""
            }`}>
            <Image
              src={notification.imageUrl!}
              alt=""
              width={40}
              height={40}
              className="h-full w-full object-cover"
              sizes="40px"
              unoptimized
              onError={() => setImageFailed(true)}
            />
          </div>
        ) : (
          <IconBadge isNewProgram={isNewProgram} isFresh={isFresh} />
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#c6d4df] transition-colors group-hover:text-white">
            {notification.programTitle}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-[#8f98a0]">
            {isNewProgram && (
              <span className="inline-flex items-center rounded-sm border border-[#4a90c4] bg-[#1a3a5c] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#9fc6e3]">
                New
              </span>
            )}
            {message ? <span className="text-[#8f98a0]">{message}</span> : null}
            <span className={isFresh ? "text-[#556772]" : "text-[#556772]/80"}>
              {createdAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric"
              })}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-[#556772] transition-colors group-hover:text-[#c6d4df]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
