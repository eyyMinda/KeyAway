import { revalidatePath, revalidateTag } from "next/cache";
import type { SanityImageSource } from "@sanity/image-url";
import { TAG_NOTIFICATION_FEED } from "@/src/lib/cache/cacheTags";
import { client } from "@/src/sanity/lib/client";
import { urlFor } from "@/src/sanity/lib/image";
import type { Notification, NotificationType } from "@/src/types/notifications";

/** Legacy singleton `_id` (migrated to append-only feed documents). */
export const SITE_NOTIFICATION_FEED_DOCUMENT_ID = "siteNotificationFeed";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Activity window when building each snapshot (header + new feed rows). */
export const NOTIFICATION_SNAPSHOT_WINDOW_DAYS = 30;
const SNAPSHOT_WINDOW_MS = NOTIFICATION_SNAPSHOT_WINDOW_DAYS * DAY_MS;

/** Max rows per snapshot document (after global sort by activity time). */
const MAX_ITEMS_PER_SNAPSHOT = 15;

/** Default /updates page window; extended via `?days=` query param. */
export const UPDATES_PAGE_DEFAULT_DAYS = 90;
export const UPDATES_PAGE_DAYS_INCREMENT = 90;
export const UPDATES_PAGE_MAX_DAYS = 365 * 2;

/** Cap stored feed documents so the dataset stays bounded. */
const MAX_FEED_DOCUMENTS = 120;

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

type FeedDocument = {
  _id: string;
  _createdAt?: string;
  generatedAt?: string;
  items?: FeedRow[];
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

function parseFeedRow(raw: FeedRow): Notification | null {
  if (
    typeof raw?.id !== "string" ||
    typeof raw.programSlug !== "string" ||
    typeof raw.programTitle !== "string" ||
    typeof raw.createdAt !== "string" ||
    typeof raw.type !== "string"
  ) {
    return null;
  }
  const t = raw.type as NotificationType;
  if (t !== "new_program" && t !== "new_program_with_keys" && t !== "new_keys") return null;
  return {
    id: raw.id,
    type: t,
    programSlug: raw.programSlug,
    programTitle: raw.programTitle,
    ...(typeof raw.message === "string" && raw.message.length ? { message: raw.message } : {}),
    createdAt: raw.createdAt,
    ...(typeof raw.imageUrl === "string" && raw.imageUrl.length ? { imageUrl: raw.imageUrl } : {})
  };
}

function snapshotSignature(items: FeedRow[]): string {
  return JSON.stringify(
    items.map(i => ({
      id: i.id,
      type: i.type,
      createdAt: i.createdAt,
      message: i.message
    }))
  );
}

function mergeNotificationsFromDocuments(docs: FeedDocument[]): Notification[] {
  const byId = new Map<string, Notification>();

  for (const doc of docs) {
    for (const raw of doc.items ?? []) {
      const parsed = parseFeedRow(raw);
      if (!parsed) continue;
      const existing = byId.get(parsed.id);
      if (!existing || new Date(parsed.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
        byId.set(parsed.id, parsed);
      }
    }
  }

  return [...byId.values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

async function fetchFeedDocuments(cached = false): Promise<FeedDocument[]> {
  const docs = await client.fetch<FeedDocument[]>(
    `*[_type == "siteNotificationFeed"] | order(coalesce(generatedAt, _createdAt) desc) {
      _id,
      _createdAt,
      generatedAt,
      items
    }`,
    {},
    cached ? { next: { tags: [TAG_NOTIFICATION_FEED] } } : undefined
  );
  return docs ?? [];
}

async function pruneOldFeedDocuments(docs: FeedDocument[]): Promise<void> {
  if (docs.length <= MAX_FEED_DOCUMENTS) return;
  const excess = docs.slice(MAX_FEED_DOCUMENTS);
  for (const doc of excess) {
    if (doc._id === SITE_NOTIFICATION_FEED_DOCUMENT_ID) continue;
    try {
      await client.delete(doc._id);
    } catch {
      // non-fatal
    }
  }
}

/** Recompute snapshot from programs and append a new feed document (does not rewrite history). */
export async function rebuildSiteNotificationFeed(): Promise<void> {
  const now = Date.now();
  const windowStartMs = now - SNAPSHOT_WINDOW_MS;

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

    if (!isNewListing && newlyAddedKeys.length === 0) continue;

    const canonicalId = `${NOTIFICATION_ID_PREFIX}${program._id}`;
    const imageUrl = programImageUrl(program.image);

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
    .slice(0, MAX_ITEMS_PER_SNAPSHOT);

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

  const existingDocs = await fetchFeedDocuments();
  const latestDoc = existingDocs[0];

  if (items.length > 0) {
    const nextSignature = snapshotSignature(items);
    const latestSignature = latestDoc?.items ? snapshotSignature(latestDoc.items) : null;

    if (nextSignature !== latestSignature) {
      await client.create({
        _type: "siteNotificationFeed",
        generatedAt: new Date().toISOString(),
        windowDays: NOTIFICATION_SNAPSHOT_WINDOW_DAYS,
        items
      });
    }
  }

  const refreshedDocs = await fetchFeedDocuments();
  await pruneOldFeedDocuments(refreshedDocs);

  revalidateTag(TAG_NOTIFICATION_FEED, "max");
  revalidatePath("/api/v1/notifications/recent");
  revalidatePath("/updates");
}

/** Latest snapshot — used by header bell API. */
export async function readSiteNotificationFeed(): Promise<Notification[]> {
  const docs = await fetchFeedDocuments(true);
  const latest = docs[0];
  if (!latest?.items?.length) return [];

  const out: Notification[] = [];
  for (const raw of latest.items) {
    const parsed = parseFeedRow(raw);
    if (parsed) out.push(parsed);
  }
  return out;
}

/** Merged history across all feed snapshots (deduped by notification id). */
export async function readSiteNotificationHistory(): Promise<Notification[]> {
  const docs = await fetchFeedDocuments(true);
  return mergeNotificationsFromDocuments(docs);
}

export function filterNotificationsByDays(notifications: Notification[], days: number): Notification[] {
  const cutoffMs = Date.now() - days * DAY_MS;
  return notifications.filter(n => {
    const ts = new Date(n.createdAt).getTime();
    return Number.isFinite(ts) && ts >= cutoffMs;
  });
}

export function hasOlderNotifications(notifications: Notification[], days: number): boolean {
  const cutoffMs = Date.now() - days * DAY_MS;
  return notifications.some(n => {
    const ts = new Date(n.createdAt).getTime();
    return Number.isFinite(ts) && ts < cutoffMs;
  });
}

export function resolveUpdatesPageDays(raw?: string): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < UPDATES_PAGE_DEFAULT_DAYS) {
    return UPDATES_PAGE_DEFAULT_DAYS;
  }
  return Math.min(parsed, UPDATES_PAGE_MAX_DAYS);
}
