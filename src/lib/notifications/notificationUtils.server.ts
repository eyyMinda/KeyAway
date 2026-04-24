import type { SanityImageSource } from "@sanity/image-url";
import { client } from "@/src/sanity/lib/client";
import { urlFor } from "@/src/sanity/lib/image";
import { Notification } from "@/src/types/notifications";

function programImageUrl(image: unknown): string | undefined {
  if (!image || typeof image !== "object") return undefined;
  const img = image as Record<string, unknown>;
  const asset = img.asset;
  if (!asset || typeof asset !== "object") return undefined;
  const ref = (asset as Record<string, unknown>)._ref;
  if (typeof ref !== "string" || !ref.length) return undefined;
  try {
    return urlFor(image as SanityImageSource).width(80).height(80).fit("max").auto("format").quality(75).url();
  } catch {
    return undefined;
  }
}

/**
 * Get recent notifications (new programs and newly added CD keys within the last calendar month)
 */
export async function getRecentNotifications(): Promise<Notification[]> {
  const filterAgo = new Date();
  filterAgo.setMonth(filterAgo.getMonth() - 1);

  try {
    // Fetch all programs once
    const programs = await client.fetch<
      Array<{
        _id: string;
        _createdAt: string;
        _updatedAt: string;
        title: string;
        slug: { current: string };
        image?: unknown;
        cdKeys: Array<{ status: string; createdAt?: string; validFrom: string }>;
      }>
    >(
      `*[_type == "program"] | order(_createdAt desc) {
        _id,
        _createdAt,
        _updatedAt,
        title,
        slug,
        image,
        "cdKeys": cdKeys[]{ status, createdAt, validFrom }
      }`,
      {},
      { next: { tags: ["notifications", "programs"] } }
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
          createdAt: program._createdAt,
          imageUrl: programImageUrl(program.image)
        });
        // Don't continue - still check for new keys even if program is new
      }

      // Check for newly added keys (both new and existing programs)
      if (program.cdKeys && program.cdKeys.length > 0) {
        // Find keys that were created in the last calendar month
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
            keyStatus: keyStatus,
            imageUrl: programImageUrl(program.image)
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
