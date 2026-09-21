import { TAG_NOTIFICATION_FEED } from "@/src/lib/cache/cacheTags";
import { client } from "@/src/sanity/lib/client";
import type { Notification } from "@/src/types/notifications";

export const NOTIFICATION_BUNDLE_CAPACITY = 500;
/** How far back rebuild scans program keys when appending history (~2 catalog years). */
export const NOTIFICATION_HISTORY_DERIVE_DAYS = 730;

export type NotificationHistoryRow = {
  id: string;
  type: string;
  programSlug: string;
  programTitle: string;
  message?: string;
  createdAt: string;
  imageUrl?: string;
};

type BundleDoc = {
  _id: string;
  timeRangeStart?: string;
  timeRangeEnd?: string;
  eventCount?: number;
  capacity?: number;
  items?: NotificationHistoryRow[];
};

export function notificationDedupeKey(n: Pick<Notification, "id" | "createdAt" | "type" | "message">): string {
  return `${n.id}|${n.createdAt}|${n.type}|${n.message ?? ""}`;
}

function toHistoryRow(n: Notification): NotificationHistoryRow {
  return {
    id: n.id,
    type: n.type,
    programSlug: n.programSlug,
    programTitle: n.programTitle,
    ...(n.message ? { message: n.message } : {}),
    createdAt: n.createdAt,
    ...(n.imageUrl ? { imageUrl: n.imageUrl } : {})
  };
}

function stableItemKey(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120) || "item";
}

function rowToNotification(raw: NotificationHistoryRow): Notification | null {
  if (
    !raw.id ||
    !raw.programSlug ||
    !raw.programTitle ||
    !raw.createdAt ||
    (raw.type !== "new_program" && raw.type !== "new_program_with_keys" && raw.type !== "new_keys")
  ) {
    return null;
  }
  return {
    id: raw.id,
    type: raw.type,
    programSlug: raw.programSlug,
    programTitle: raw.programTitle,
    ...(raw.message ? { message: raw.message } : {}),
    createdAt: raw.createdAt,
    ...(raw.imageUrl ? { imageUrl: raw.imageUrl } : {})
  };
}

function timeRangeFromItems(items: NotificationHistoryRow[]): { start?: string; end?: string } {
  let startMs = Infinity;
  let endMs = -Infinity;
  for (const item of items) {
    const ts = new Date(item.createdAt).getTime();
    if (!Number.isFinite(ts)) continue;
    startMs = Math.min(startMs, ts);
    endMs = Math.max(endMs, ts);
  }
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return {};
  return { start: new Date(startMs).toISOString(), end: new Date(endMs).toISOString() };
}

async function fetchBundles(cached: boolean): Promise<BundleDoc[]> {
  return (
    (await client.fetch<BundleDoc[]>(
      `*[_type == "siteNotificationBundle"] | order(timeRangeEnd desc) {
        _id, timeRangeStart, timeRangeEnd, eventCount, capacity, items
      }`,
      {},
      cached ? { next: { tags: [TAG_NOTIFICATION_FEED] } } : undefined
    )) ?? []
  );
}

async function fetchExistingHistoryKeys(cached: boolean): Promise<Set<string>> {
  const bundles = await fetchBundles(cached);
  const keys = new Set<string>();
  for (const bundle of bundles) {
    for (const raw of bundle.items ?? []) {
      const parsed = rowToNotification(raw);
      if (parsed) keys.add(notificationDedupeKey(parsed));
    }
  }
  return keys;
}

async function getOpenBundle(): Promise<BundleDoc | null> {
  const bundles = await fetchBundles(false);
  for (const bundle of bundles) {
    const cap = bundle.capacity ?? NOTIFICATION_BUNDLE_CAPACITY;
    const count = bundle.eventCount ?? bundle.items?.length ?? 0;
    if (count < cap) return bundle;
  }
  return null;
}

async function createEmptyBundle(): Promise<BundleDoc> {
  const now = new Date().toISOString();
  const created = await client.create({
    _type: "siteNotificationBundle",
    bundledAt: now,
    timeRangeStart: now,
    timeRangeEnd: now,
    eventCount: 0,
    capacity: NOTIFICATION_BUNDLE_CAPACITY,
    items: []
  });
  return {
    _id: created._id,
    timeRangeStart: now,
    timeRangeEnd: now,
    eventCount: 0,
    capacity: NOTIFICATION_BUNDLE_CAPACITY,
    items: []
  };
}

/** Append only events not already present in bundled history. */
export async function appendNotificationHistoryEvents(events: Notification[]): Promise<number> {
  if (!events.length) return 0;

  const existing = await fetchExistingHistoryKeys(false);
  const fresh = events.filter(e => !existing.has(notificationDedupeKey(e)));
  if (!fresh.length) return 0;

  fresh.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  let appended = 0;
  let queue = fresh.map(toHistoryRow);

  while (queue.length > 0) {
    let bundle = await getOpenBundle();
    if (!bundle) bundle = await createEmptyBundle();

    const cap = bundle.capacity ?? NOTIFICATION_BUNDLE_CAPACITY;
    const currentItems = bundle.items ?? [];
    const count = bundle.eventCount ?? currentItems.length;
    const space = Math.max(0, cap - count);
    if (space === 0) {
      bundle = await createEmptyBundle();
      continue;
    }

    const chunk = queue.splice(0, space);
    const nextItems = [
      ...currentItems,
      ...chunk.map(row => ({
        _key: stableItemKey(row.id),
        ...row
      }))
    ];
    const range = timeRangeFromItems(nextItems);

    await client
      .patch(bundle._id)
      .set({
        items: nextItems,
        eventCount: nextItems.length,
        ...(range.start ? { timeRangeStart: range.start } : {}),
        ...(range.end ? { timeRangeEnd: range.end } : {})
      })
      .commit();

    appended += chunk.length;
  }

  return appended;
}

export async function readBundledNotificationHistory(cached = true): Promise<Notification[]> {
  const bundles = await fetchBundles(cached);
  const seen = new Set<string>();
  const out: Notification[] = [];

  for (const bundle of bundles) {
    for (const raw of bundle.items ?? []) {
      const parsed = rowToNotification(raw);
      if (!parsed) continue;
      const key = notificationDedupeKey(parsed);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(parsed);
    }
  }

  return out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
