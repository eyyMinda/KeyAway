import Link from "next/link";
import { Notification } from "@/src/types/notifications";

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

export default function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const isNewProgram = notification.type === "new_program";

  return (
    <Link
      href={`/program/${notification.programSlug}`}
      onClick={onClose}
      className="block px-4 py-3 hover:bg-gray-750/50 transition-all duration-200 border-b border-gray-700 last:border-b-0 group">
      <div className="flex items-start gap-3">
        {/* Icon Badge */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
            isNewProgram ? "bg-blue-500/10 border border-blue-500/30" : "bg-green-500/10 border border-green-500/30"
          }`}>
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

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                isNewProgram
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "bg-green-500/20 text-green-300 border border-green-500/30"
              }`}>
              {isNewProgram ? "NEW" : "UPDATED"}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(notification.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric"
              })}
            </span>
          </div>
          <p className="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors truncate">
            {notification.programTitle}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{notification.message}</p>
        </div>

        {/* Arrow - Blinking animation */}
        <div className="flex-shrink-0 text-gray-600 group-hover:text-white transition-colors animate-pulse-white">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
