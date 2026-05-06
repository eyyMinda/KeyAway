import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { TAG_NOTIFICATIONS, TAG_PROGRAMS_FULL } from "@/src/lib/cache/cacheTags";
import { PUBLIC_ISR_REVALIDATE_SECONDS } from "@/src/lib/cache/constants";
import { getRecentNotifications } from "@/src/lib/notifications/notificationUtils.server";

/** Cache key segment bumps invalidate old entries when notification payload shape changes (e.g. `imageUrl`). */
const getRecentNotificationsCached = unstable_cache(
  async () => getRecentNotifications(),
  ["api-recent-notifications", "slim-notification-payload-1"],
  {
    revalidate: PUBLIC_ISR_REVALIDATE_SECONDS,
    tags: [TAG_NOTIFICATIONS, TAG_PROGRAMS_FULL]
  }
);

/** GET /api/v1/notifications/recent — public recent program/key notifications (client-fetched from header). */
export async function GET() {
  try {
    const notifications = await getRecentNotificationsCached();
    return NextResponse.json(
      { data: { notifications }, meta: {} },
      {
        headers: {
          // `private` keeps shared caches from ignoring `revalidateTag`; short max-age matches `unstable_cache` fallback.
          "Cache-Control": `private, max-age=${PUBLIC_ISR_REVALIDATE_SECONDS}, stale-while-revalidate=${PUBLIC_ISR_REVALIDATE_SECONDS * 2}`
        }
      }
    );
  } catch (e) {
    console.error("[GET /api/v1/notifications/recent]", e);
    return NextResponse.json({ data: { notifications: [] }, meta: {} }, { status: 200 });
  }
}
