import { client } from "@/src/sanity/lib/client";
import { Notification } from "@/src/types/notifications";

/**
 * Get recent notifications (new programs and newly added CD keys within last 30 days)
 */
export async function getRecentNotifications(): Promise<Notification[]> {
  const filterAgo = new Date();
  filterAgo.setMonth(filterAgo.getMonth() - 1);
  filterAgo.setDate(filterAgo.getDate() - 14);

  try {
    // Fetch all programs once
    const programs = await client.fetch<
      Array<{
        _id: string;
        _createdAt: string;
        _updatedAt: string;
        title: string;
        slug: { current: string };
        cdKeys: Array<{ _key: string; key: string; status: string; createdAt?: string; validFrom: string }>;
      }>
    >(
      `*[_type == "program"] | order(_createdAt desc) {
        _id,
        _createdAt,
        _updatedAt,
        title,
        slug,
        cdKeys[]
      }`
    );

    const notifications: Notification[] = [];

    for (const program of programs) {
      const programActivityAt = new Date(program._createdAt) || new Date(program._updatedAt);
      const isNewProgram = programActivityAt > filterAgo;

      // Check if program itself is new
      if (isNewProgram) {
        notifications.push({
          id: `program-${program._id}`,
          type: "new_program",
          programSlug: program.slug.current,
          programTitle: program.title,
          message: "New program added",
          createdAt: program._createdAt
        });
        // Don't continue - still check for new keys even if program is new
      }

      // Check for newly added keys (both new and existing programs)
      if (program.cdKeys && program.cdKeys.length > 0) {
        // Find keys that were created in the last 30 days
        const newlyAddedKeys = program.cdKeys.filter(key => {
          const keyDate = key.createdAt || key.validFrom;
          if (!keyDate) return false;

          const keyCreatedAt = new Date(keyDate);
          return keyCreatedAt >= filterAgo && (key.status === "new" || key.status === "active");
        });

        if (newlyAddedKeys.length > 0) {
          // Get the most recent key creation date and status
          const mostRecentKey = newlyAddedKeys.reduce((latest, key) => {
            const keyDate = new Date(key.createdAt || key.validFrom);
            const latestDate = new Date(latest.createdAt || latest.validFrom);
            return keyDate > latestDate ? key : latest;
          });

          const mostRecentKeyDate = mostRecentKey.createdAt || mostRecentKey.validFrom;
          const keyStatus = mostRecentKey.status as "new" | "active";

          notifications.push({
            id: `keys-${program._id}`,
            type: "new_keys",
            programSlug: program.slug.current,
            programTitle: program.title,
            message: `${newlyAddedKeys.length} new ${newlyAddedKeys.length === 1 ? "key" : "keys"} added`,
            createdAt: mostRecentKeyDate,
            keysCount: newlyAddedKeys.length,
            keyStatus: keyStatus
          });
        }
      }
    }

    // Sort by date (most recent first) and limit to 10
    return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}
