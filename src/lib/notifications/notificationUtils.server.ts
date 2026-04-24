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

function keysAddedLine(n: number): string {
  return n === 1 ? "1 key added" : `${n} keys added`;
}

/**
 * Recent notifications: programs whose `_createdAt` is in the last month ("new"),
 * plus existing programs with keys added in that window ("keys only").
 */
export async function getRecentNotifications(): Promise<Notification[]> {
  const filterAgo = new Date();
  filterAgo.setMonth(filterAgo.getMonth() - 1);
  const filterMs = filterAgo.getTime();

  try {
    const programs = await client.fetch<
      Array<{
        _id: string;
        _createdAt: string;
        title: string;
        slug: { current: string };
        image?: unknown;
        cdKeys: Array<{ status: string; createdAt?: string; validFrom: string }>;
      }>
    >(
      `*[_type == "program"] | order(_createdAt desc) {
        _id,
        _createdAt,
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
      const created = new Date(program._createdAt);
      const createdMs = created.getTime();
      /** Strict: document creation time only (not `_updatedAt`). */
      const isNewProgram = Number.isFinite(createdMs) && createdMs > filterMs;

      const newlyAddedKeys =
        program.cdKeys?.length > 0
          ? program.cdKeys.filter(key => {
              const keyDate = key.createdAt || key.validFrom;
              if (!keyDate) return false;
              const keyCreatedAt = new Date(keyDate);
              return keyCreatedAt.getTime() >= filterMs && (key.status === "new" || key.status === "active");
            })
          : [];

      const imageUrl = programImageUrl(program.image);

      if (isNewProgram && newlyAddedKeys.length > 0) {
        const mostRecentKey = newlyAddedKeys.reduce((latest, key) => {
          const keyDate = new Date(key.createdAt || key.validFrom);
          const latestDate = new Date(latest.createdAt || latest.validFrom);
          return keyDate > latestDate ? key : latest;
        });
        const mostRecentKeyDate = mostRecentKey.createdAt || mostRecentKey.validFrom;
        const n = newlyAddedKeys.length;
        const createdTs = Math.max(createdMs, new Date(mostRecentKeyDate).getTime());

        notifications.push({
          id: `program-${program._id}`,
          type: "new_program_with_keys",
          programSlug: program.slug.current,
          programTitle: program.title,
          message: keysAddedLine(n),
          createdAt: new Date(createdTs).toISOString(),
          imageUrl
        });
      } else if (isNewProgram) {
        notifications.push({
          id: `program-${program._id}`,
          type: "new_program",
          programSlug: program.slug.current,
          programTitle: program.title,
          createdAt: program._createdAt,
          imageUrl
        });
      } else if (newlyAddedKeys.length > 0) {
        const mostRecentKey = newlyAddedKeys.reduce((latest, key) => {
          const keyDate = new Date(key.createdAt || key.validFrom);
          const latestDate = new Date(latest.createdAt || latest.validFrom);
          return keyDate > latestDate ? key : latest;
        });

        const mostRecentKeyDate = mostRecentKey.createdAt || mostRecentKey.validFrom;
        const n = newlyAddedKeys.length;

        notifications.push({
          id: `keys-${program._id}`,
          type: "new_keys",
          programSlug: program.slug.current,
          programTitle: program.title,
          message: keysAddedLine(n),
          createdAt: mostRecentKeyDate,
          imageUrl
        });
      }
    }

    return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}
