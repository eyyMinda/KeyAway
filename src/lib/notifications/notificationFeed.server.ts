import { revalidatePath, revalidateTag } from "next/cache";
import type { SanityImageSource } from "@sanity/image-url";
import { TAG_NOTIFICATION_FEED } from "@/src/lib/cache/cacheTags";
import { client } from "@/src/sanity/lib/client";
import { urlFor } from "@/src/sanity/lib/image";
import type { Notification, NotificationType } from "@/src/types/notifications";

/** Fixed `_id` so only one feed document exists in the dataset. */
export const SITE_NOTIFICATION_FEED_DOCUMENT_ID = "siteNotificationFeed";

/** Max rows stored on the singleton feed (after global sort by activity time). */
const MAX_ITEMS = 15;

/** ~1 month: program must be touched in Sanity in this window to appear; same window for “new listing” / key dates. */
const FEED_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const NOTIFICATION_ID_PREFIX = "program-notify-";

type FeedRow = {
  id?: string;
  type?: string;
  programSlug?: string;
  programTitle?: string;
  message?: string;
  createdAt?: string;
  imageUrl?: string;
};

function programImageUrl(image: unknown): string | undefined {
  if (!image || typeof image !== "object") return undefined;
  const img = image as Record<string, unknown>;
  const asset = img.asset;
  if (!asset || typeof asset !== "object") return undefined;
  const ref = (asset as Record<string, unknown>)._ref;
  if (typeof ref !== "string" || !ref.length) return undefined;
  try {
    return urlFor(image as SanityImageSource)
      .width(80)
      .height(80)
      .fit("max")
      .auto("format")
      .quality(75)
      .url();
  } catch {
    return undefined;
  }
}

function keysAddedLine(n: number): string {
  return n === 1 ? "1 key added" : `${n} keys added`;
}

function stableItemKey(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120) || "item";
}

/** Recompute feed from all programs (heavy — call only from webhook/admin/cron, not per GET). */
export async function rebuildSiteNotificationFeed(): Promise<void> {
  const now = Date.now();
  const windowStartMs = now - FEED_WINDOW_MS;

  /** Every program is scanned; only rows with `_updatedAt` in the window qualify (embedding key edits bumps this). */
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
    `*[_type == "program"] {
      _id,
      _createdAt,
      _updatedAt,
      title,
      slug,
      image,
      "cdKeys": cdKeys[]{ status, createdAt, validFrom }
    }`
  );

  const notifications: Notification[] = [];

  for (const program of programs ?? []) {
    const updatedMs = new Date(program._updatedAt).getTime();
    if (!Number.isFinite(updatedMs) || updatedMs < windowStartMs) continue;

    const created = new Date(program._createdAt);
    const createdMs = created.getTime();
    const isNewListing = Number.isFinite(createdMs) && createdMs >= windowStartMs;

    const newlyAddedKeys =
      program.cdKeys?.length > 0
        ? program.cdKeys.filter(key => {
            const keyDate = key.createdAt || key.validFrom;
            if (!keyDate) return false;
            const keyTs = new Date(keyDate).getTime();
            return (
              Number.isFinite(keyTs) && keyTs >= windowStartMs && (key.status === "new" || key.status === "active")
            );
          })
        : [];

    /** Skip meaningless bumps (e.g. title-only) with no listing/key signal in-window. */
    if (!isNewListing && newlyAddedKeys.length === 0) continue;

    const canonicalId = `${NOTIFICATION_ID_PREFIX}${program._id}`;
    const imageUrl = programImageUrl(program.image);

    // Exactly one notification per program: pick a single merged row (prefer “new listing + keys”, else listing, else keys).
    if (isNewListing && newlyAddedKeys.length > 0) {
      const mostRecentKey = newlyAddedKeys.reduce((latest, key) => {
        const keyDate = new Date(key.createdAt || key.validFrom);
        const latestDate = new Date(latest.createdAt || latest.validFrom);
        return keyDate > latestDate ? key : latest;
      });
      const mostRecentKeyDate = mostRecentKey.createdAt || mostRecentKey.validFrom;
      const n = newlyAddedKeys.length;
      const createdTs = Math.max(createdMs, new Date(mostRecentKeyDate).getTime());

      notifications.push({
        id: canonicalId,
        type: "new_program_with_keys",
        programSlug: program.slug.current,
        programTitle: program.title,
        message: keysAddedLine(n),
        createdAt: new Date(createdTs).toISOString(),
        imageUrl
      });
    } else if (isNewListing) {
      notifications.push({
        id: canonicalId,
        type: "new_program",
        programSlug: program.slug.current,
        programTitle: program.title,
        createdAt: program._createdAt,
        imageUrl
      });
    } else {
      const mostRecentKey = newlyAddedKeys.reduce((latest, key) => {
        const keyDate = new Date(key.createdAt || key.validFrom);
        const latestDate = new Date(latest.createdAt || latest.validFrom);
        return keyDate > latestDate ? key : latest;
      });

      const mostRecentKeyDate = mostRecentKey.createdAt || mostRecentKey.validFrom;
      const n = newlyAddedKeys.length;

      notifications.push({
        id: canonicalId,
        type: "new_keys",
        programSlug: program.slug.current,
        programTitle: program.title,
        message: keysAddedLine(n),
        createdAt: mostRecentKeyDate,
        imageUrl
      });
    }
  }

  const sorted = notifications
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_ITEMS);

  const items = sorted.map(n => ({
    _key: stableItemKey(n.id),
    id: n.id,
    type: n.type,
    programSlug: n.programSlug,
    programTitle: n.programTitle,
    ...(n.message ? { message: n.message } : {}),
    createdAt: n.createdAt,
    ...(n.imageUrl ? { imageUrl: n.imageUrl } : {})
  }));

  await client.createOrReplace({
    _id: SITE_NOTIFICATION_FEED_DOCUMENT_ID,
    _type: "siteNotificationFeed",
    items
  });

  revalidateTag(TAG_NOTIFICATION_FEED, "max");
  revalidatePath("/api/v1/notifications/recent");
}

export async function readSiteNotificationFeed(): Promise<Notification[]> {
  const row = await client.fetch<{ items?: FeedRow[] } | null>(
    `*[_id == $id][0]{ items }`,
    { id: SITE_NOTIFICATION_FEED_DOCUMENT_ID },
    { next: { tags: [TAG_NOTIFICATION_FEED] } }
  );

  const list = row?.items ?? [];
  const out: Notification[] = [];
  for (const raw of list) {
    if (
      typeof raw?.id !== "string" ||
      typeof raw.programSlug !== "string" ||
      typeof raw.programTitle !== "string" ||
      typeof raw.createdAt !== "string" ||
      typeof raw.type !== "string"
    ) {
      continue;
    }
    const t = raw.type as NotificationType;
    if (t !== "new_program" && t !== "new_program_with_keys" && t !== "new_keys") continue;
    out.push({
      id: raw.id,
      type: t,
      programSlug: raw.programSlug,
      programTitle: raw.programTitle,
      ...(typeof raw.message === "string" && raw.message.length ? { message: raw.message } : {}),
      createdAt: raw.createdAt,
      ...(typeof raw.imageUrl === "string" && raw.imageUrl.length ? { imageUrl: raw.imageUrl } : {})
    });
  }
  return out;
}
