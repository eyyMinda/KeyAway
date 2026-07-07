import Link from "next/link";
import Image from "next/image";
import type { Notification } from "@/src/types/notifications";

type UpdateFeedItemProps = {
  notification: Notification;
};

export default function UpdateFeedItem({ notification }: UpdateFeedItemProps) {
  const isNewProgram = notification.type === "new_program" || notification.type === "new_program_with_keys";
  const message = notification.message?.trim() ?? "";
  const createdAt = new Date(notification.createdAt);

  return (
    <li>
      <Link
        href={`/program/${notification.programSlug}`}
        className="group flex items-start gap-3 rounded-sm border border-[#2a475e] bg-[#1b2838] px-4 py-3 transition-colors hover:border-[#4a90c4] hover:bg-[#213246] sm:px-5 sm:py-4">
        {notification.imageUrl ? (
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-sm border border-[#2a475e]">
            <Image
              src={notification.imageUrl}
              alt=""
              width={44}
              height={44}
              className="h-full w-full object-cover"
              sizes="44px"
              unoptimized
            />
          </div>
        ) : (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border ${
              isNewProgram ? "border-[#4a90c4] bg-[#1a3a5c]" : "border-[#3d6e1c] bg-[#1a3a2a]"
            }`}>
            <span className="text-lg" aria-hidden>
              {isNewProgram ? "✨" : "🔑"}
            </span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#c6d4df] transition-colors group-hover:text-white">
            {notification.programTitle}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#8f98a0]">
            {isNewProgram ? (
              <span className="inline-flex rounded-sm border border-[#4a90c4] bg-[#1a3a5c] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#9fc6e3]">
                New listing
              </span>
            ) : (
              <span className="inline-flex rounded-sm border border-[#3d6e1c] bg-[#1a3a2a] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8bc34a]">
                Keys added
              </span>
            )}
            {message ? <span>{message}</span> : null}
            <time dateTime={notification.createdAt}>
              {createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </time>
          </div>
        </div>
      </Link>
    </li>
  );
}
