import { readSiteNotificationFeed } from "@/src/lib/notifications/notificationFeed.server";
import type { Notification } from "@/src/types/notifications";

/**
 * Recent notifications from singleton `siteNotificationFeed` (rebuilt on program/key writes).
 */
export async function getRecentNotifications(): Promise<Notification[]> {
  try {
    return await readSiteNotificationFeed();
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}
