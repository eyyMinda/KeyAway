import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getRecentNotifications } from "@/src/lib/notifications/notificationUtils.server";

/** Cache key segment bumps invalidate old entries when notification payload shape changes (e.g. `imageUrl`). */
const getRecentNotificationsCached = unstable_cache(
  async () => getRecentNotifications(),
  ["api-recent-notifications", "slim-notification-payload-1"],
  { revalidate: 1800, tags: ["notifications", "programs"] }
);

/** GET /api/v1/notifications/recent — public recent program/key notifications (client-fetched from header). */
export async function GET() {
  try {
    const notifications = await getRecentNotificationsCached();
    return NextResponse.json(
      { data: { notifications }, meta: {} },
      {
        headers: {
          "Cache-Control": "public, max-age=1800, s-maxage=1800, stale-while-revalidate=3600"
        }
      }
    );
  } catch (e) {
    console.error("[GET /api/v1/notifications/recent]", e);
    return NextResponse.json({ data: { notifications: [] }, meta: {} }, { status: 200 });
  }
}
