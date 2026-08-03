import Link from "next/link";
import Image from "next/image";
import { formatUpdateDay } from "@/src/lib/updates/updatesPageUtils";
import type { Notification } from "@/src/types/notifications";

type UpdateFeedItemProps = {
  notification: Notification;
};

export default function UpdateFeedItem({ notification }: UpdateFeedItemProps) {
  const isNewProgram = notification.type === "new_program" || notification.type === "new_program_with_keys";
  const message = notification.message?.trim() ?? "";

  return (
    <li>
      <Link
        href={`/program/${notification.programSlug}`}
        className="group flex items-center gap-4 py-3.5 sm:py-4 transition-colors hover:bg-[#1b2838]/60">
        {notification.imageUrl ? (
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-sm border border-[#2a475e] sm:h-11 sm:w-11">
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
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border sm:h-11 sm:w-11 ${
              isNewProgram ? "border-[#4a90c4] bg-[#1a3a5c]" : "border-[#3d6e1c] bg-[#1a3a2a]"
            }`}>
            <span className="text-base sm:text-lg" aria-hidden>
              {isNewProgram ? "✨" : "🔑"}
            </span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="font-semibold text-[#c6d4df] transition-colors group-hover:text-white">
              {notification.programTitle}
            </p>
            {isNewProgram ? (
              <span className="inline-flex rounded-sm border border-[#4a90c4] bg-[#1a3a5c] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#9fc6e3]">
                New listing
              </span>
            ) : (
              <span className="inline-flex rounded-sm border border-[#3d6e1c] bg-[#1a3a2a] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8bc34a]">
                Keys added
              </span>
            )}
          </div>
          {message ? <p className="mt-0.5 text-sm text-[#8f98a0]">{message}</p> : null}
        </div>

        <time
          dateTime={notification.createdAt}
          className="hidden shrink-0 text-xs tabular-nums text-[#8f98a0] sm:block sm:text-sm">
          {formatUpdateDay(notification.createdAt)}
        </time>
      </Link>
    </li>
  );
}
