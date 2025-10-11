import { client } from "@/src/sanity/lib/client";
import { Notification } from "@/src/types/notifications";

/**
 * Get recent notifications (new programs and updated CD keys within last 30 days)
 */
export async function getRecentNotifications(): Promise<Notification[]> {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const since = oneMonthAgo.toISOString();

  try {
    // Fetch all programs to check for recent updates
    const programs = await client.fetch<
      Array<{
        _id: string;
        _createdAt: string;
        _updatedAt: string;
        title: string;
        slug: { current: string };
        cdKeys: Array<{ _key: string; key: string; status: string }>;
      }>
    >(
      `*[_type == "program" && (_createdAt >= $since || _updatedAt >= $since)] | order(_updatedAt desc) {
        _id,
        _createdAt,
        _updatedAt,
        title,
        slug,
        cdKeys[]
      }`,
      { since }
    );

    const notifications: Notification[] = [];

    for (const program of programs) {
      const programCreatedAt = new Date(program._createdAt);
      const programUpdatedAt = new Date(program._updatedAt);
      const isNewProgram = programCreatedAt > oneMonthAgo;

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
      }
      // Check if program was updated recently (keys were likely added)
      else if (programUpdatedAt > oneMonthAgo && program.cdKeys && program.cdKeys.length > 0) {
        // Count only active keys (exclude expired and limit reached)
        const activeKeys = program.cdKeys.filter(
          key => key.status !== "expired" && key.status !== "limit" && key.status !== "limit_reached"
        );

        if (activeKeys.length > 0) {
          notifications.push({
            id: `keys-${program._id}`,
            type: "new_keys",
            programSlug: program.slug.current,
            programTitle: program.title,
            message: `Updated with ${activeKeys.length} ${activeKeys.length === 1 ? "key" : "keys"}`,
            createdAt: program._updatedAt,
            keysCount: activeKeys.length
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
