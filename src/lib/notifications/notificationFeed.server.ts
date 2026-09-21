import { revalidatePath, revalidateTag } from "next/cache";
import type { SanityImageSource } from "@sanity/image-url";
import { TAG_NOTIFICATION_FEED } from "@/src/lib/cache/cacheTags";
import {
  appendNotificationHistoryEvents,
  NOTIFICATION_HISTORY_DERIVE_DAYS,
  readBundledNotificationHistory,
} from "@/src/lib/notifications/notificationHistoryBundle";
import { getMonthKey } from "@/src/lib/site/monthSidebarUtils";
import { client } from "@/src/sanity/lib/client";
import { urlFor } from "@/src/sanity/lib/image";
import type { Notification, NotificationType } from "@/src/types/notifications";

/** Singleton bell snapshot (`createOrReplace` on rebuild). */
export const SITE_NOTIFICATION_FEED_DOCUMENT_ID = "siteNotificationFeed";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Activity window for the header bell snapshot. */
export const NOTIFICATION_SNAPSHOT_WINDOW_DAYS = 30;
const SNAPSHOT_WINDOW_MS = NOTIFICATION_SNAPSHOT_WINDOW_DAYS * DAY_MS;
const HISTORY_DERIVE_MS = NOTIFICATION_HISTORY_DERIVE_DAYS * DAY_MS;

/** Max rows in the bell snapshot (after global sort by activity time). */
const MAX_ITEMS_PER_SNAPSHOT = 15;

/** Default /updates page window; extended via `?days=` query param. */
export const UPDATES_PAGE_DEFAULT_DAYS = 90;
export const UPDATES_PAGE_DAYS_INCREMENT = 90;
export const UPDATES_PAGE_MAX_DAYS = 365 * 2;

const NOTIFICATION_ID_PREFIX = "program-notify-";

type ProgramRow = {
  _id: string;
  _createdAt: string;
  title: string;
  slug: { current: string };
  image?: unknown;
  cdKeys: Array<{ status: string; createdAt?: string; validFrom: string }>;
};

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
  if (t !== "new_program" && t !== "new_program_with_keys" && t !== "new_keys")
    return null;
  return {
    id: raw.id,
    type: t,
    programSlug: raw.programSlug,
    programTitle: raw.programTitle,
    ...(typeof raw.message === "string" && raw.message.length
      ? { message: raw.message }
      : {}),
    createdAt: raw.createdAt,
    ...(typeof raw.imageUrl === "string" && raw.imageUrl.length
      ? { imageUrl: raw.imageUrl }
      : {}),
  };
}

function snapshotSignature(items: FeedRow[]): string {
  return JSON.stringify(
    items.map((i) => ({
      id: i.id,
      type: i.type,
      createdAt: i.createdAt,
      message: i.message,
    })),
  );
}

type KeyRow = { status: string; createdAt?: string; validFrom: string };

function keyActivityIso(key: KeyRow): string | null {
  const keyDate = key.createdAt || key.validFrom;
  if (!keyDate) return null;
  const keyTs = new Date(keyDate).getTime();
  return Number.isFinite(keyTs) ? new Date(keyTs).toISOString() : null;
}

function groupKeysByMonth(keys: KeyRow[]): Map<string, KeyRow[]> {
  const byMonth = new Map<string, KeyRow[]>();
  for (const key of keys) {
    const iso = keyActivityIso(key);
    if (!iso) continue;
    const monthKey = getMonthKey(iso);
    const bucket = byMonth.get(monthKey);
    if (bucket) bucket.push(key);
    else byMonth.set(monthKey, [key]);
  }
  return byMonth;
}

function programNotifyId(programId: string, suffix: string): string {
  return `${NOTIFICATION_ID_PREFIX}${programId}::${suffix}`;
}

/** Derive notification rows from program catalog activity since `fromMs`. */
export function deriveCatalogNotificationEvents(
  programs: ProgramRow[],
  fromMs: number,
): Notification[] {
  const notifications: Notification[] = [];

  for (const program of programs ?? []) {
    const createdMs = new Date(program._createdAt).getTime();
    const isNewListing = Number.isFinite(createdMs) && createdMs >= fromMs;

    const newlyAddedKeys =
      program.cdKeys?.length > 0
        ? program.cdKeys.filter((key) => {
            const keyDate = key.createdAt || key.validFrom;
            if (!keyDate) return false;
            const keyTs = new Date(keyDate).getTime();
            return (
              Number.isFinite(keyTs) &&
              keyTs >= fromMs &&
              (key.status === "new" || key.status === "active")
            );
          })
        : [];

    if (!isNewListing && newlyAddedKeys.length === 0) continue;

    const imageUrl = programImageUrl(program.image);
    const listingMonth = getMonthKey(program._createdAt);
    const keysByMonth = groupKeysByMonth(newlyAddedKeys);

    if (isNewListing) {
      const listingMonthKeys = keysByMonth.get(listingMonth) ?? [];
      if (listingMonthKeys.length > 0) {
        const latestKeyIso = listingMonthKeys.reduce<string | null>(
          (latest, key) => {
            const iso = keyActivityIso(key);
            if (!iso) return latest;
            if (!latest) return iso;
            return new Date(iso).getTime() > new Date(latest).getTime()
              ? iso
              : latest;
          },
          null,
        );
        const createdTs = Math.max(
          createdMs,
          latestKeyIso ? new Date(latestKeyIso).getTime() : createdMs,
        );

        notifications.push({
          id: programNotifyId(program._id, `listed-${listingMonth}`),
          type: "new_program_with_keys",
          programSlug: program.slug.current,
          programTitle: program.title,
          message: keysAddedLine(listingMonthKeys.length),
          createdAt: new Date(createdTs).toISOString(),
          imageUrl,
        });
        keysByMonth.delete(listingMonth);
      } else {
        notifications.push({
          id: programNotifyId(program._id, `listed-${listingMonth}`),
          type: "new_program",
          programSlug: program.slug.current,
          programTitle: program.title,
          createdAt: program._createdAt,
          imageUrl,
        });
      }
    }

    for (const [monthKey, keys] of keysByMonth) {
      const latestIso = keys.reduce<string | null>((latest, key) => {
        const iso = keyActivityIso(key);
        if (!iso) return latest;
        if (!latest) return iso;
        return new Date(iso).getTime() > new Date(latest).getTime()
          ? iso
          : latest;
      }, null);
      if (!latestIso) continue;

      notifications.push({
        id: programNotifyId(program._id, `keys-${monthKey}`),
        type: "new_keys",
        programSlug: program.slug.current,
        programTitle: program.title,
        message: keysAddedLine(keys.length),
        createdAt: latestIso,
        imageUrl,
      });
    }
  }

  return notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

async function fetchProgramCatalog(): Promise<ProgramRow[]> {
  const programs = await client.fetch<ProgramRow[]>(
    `*[_type == "program"] {
      _id,
      _createdAt,
      title,
      slug,
      image,
      "cdKeys": cdKeys[]{ status, createdAt, validFrom }
    }`,
  );
  return programs ?? [];
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
    cached ? { next: { tags: [TAG_NOTIFICATION_FEED] } } : undefined,
  );
  return docs ?? [];
}

async function fetchBellFeedDocument(
  cached = false,
): Promise<FeedDocument | null> {
  const doc = await client.fetch<FeedDocument | null>(
    `*[_type == "siteNotificationFeed" && _id == $id][0]{
      _id,
      _createdAt,
      generatedAt,
      items
    }`,
    { id: SITE_NOTIFICATION_FEED_DOCUMENT_ID },
    cached ? { next: { tags: [TAG_NOTIFICATION_FEED] } } : undefined,
  );
  if (doc) return doc;
  const docs = await fetchFeedDocuments(cached);
  return docs[0] ?? null;
}

/** Move legacy append-only feed snapshots into bundled history, then delete extras. */
async function migrateLegacyFeedSnapshotsToBundles(): Promise<void> {
  const docs = await fetchFeedDocuments(false);
  if (!docs.length) return;

  const merged: Notification[] = [];
  const seen = new Set<string>();
  for (const doc of docs) {
    for (const raw of doc.items ?? []) {
      const parsed = parseFeedRow(raw);
      if (!parsed) continue;
      const key = `${parsed.id}|${parsed.createdAt}|${parsed.type}|${parsed.message ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(parsed);
    }
  }

  if (merged.length) {
    await appendNotificationHistoryEvents(merged);
  }

  for (const doc of docs) {
    if (doc._id === SITE_NOTIFICATION_FEED_DOCUMENT_ID) continue;
    try {
      await client.delete(doc._id);
    } catch {
      // non-fatal
    }
  }
}

async function upsertBellSnapshot(items: FeedRow[]): Promise<void> {
  const existing = await fetchBellFeedDocument(false);
  const nextSignature = snapshotSignature(items);
  const prevSignature = existing?.items
    ? snapshotSignature(existing.items)
    : null;
  if (nextSignature === prevSignature && existing) return;

  await client.createOrReplace({
    _id: SITE_NOTIFICATION_FEED_DOCUMENT_ID,
    _type: "siteNotificationFeed",
    generatedAt: new Date().toISOString(),
    windowDays: NOTIFICATION_SNAPSHOT_WINDOW_DAYS,
    items,
  });
}

/** Rebuild bell snapshot + append catalog-derived rows into bundled /updates history. */
export async function rebuildSiteNotificationFeed(): Promise<void> {
  const now = Date.now();
  const windowStartMs = now - SNAPSHOT_WINDOW_MS;
  const historyStartMs = now - HISTORY_DERIVE_MS;

  const programs = await fetchProgramCatalog();

  await migrateLegacyFeedSnapshotsToBundles();

  const historyEvents = deriveCatalogNotificationEvents(
    programs,
    historyStartMs,
  );
  await appendNotificationHistoryEvents(historyEvents);

  const bellSorted = deriveCatalogNotificationEvents(
    programs,
    windowStartMs,
  ).slice(0, MAX_ITEMS_PER_SNAPSHOT);
  const bellItems = bellSorted.map((n) => ({
    _key: stableItemKey(n.id),
    id: n.id,
    type: n.type,
    programSlug: n.programSlug,
    programTitle: n.programTitle,
    ...(n.message ? { message: n.message } : {}),
    createdAt: n.createdAt,
    ...(n.imageUrl ? { imageUrl: n.imageUrl } : {}),
  }));

  await upsertBellSnapshot(bellItems);

  revalidateTag(TAG_NOTIFICATION_FEED, "max");
  revalidatePath("/api/v1/notifications/recent");
  revalidatePath("/updates");
}

/** Latest bell snapshot — header API. */
export async function readSiteNotificationFeed(): Promise<Notification[]> {
  const latest = await fetchBellFeedDocument(true);
  if (!latest?.items?.length) return [];

  const out: Notification[] = [];
  for (const raw of latest.items) {
    const parsed = parseFeedRow(raw);
    if (parsed) out.push(parsed);
  }
  return out;
}

/** Full /updates history from bundled documents (catalog backfill on rebuild). */
export async function readSiteNotificationHistory(): Promise<Notification[]> {
  const bundled = await readBundledNotificationHistory(true);
  if (bundled.length) return bundled;

  const docs = await fetchFeedDocuments(true);
  const out: Notification[] = [];
  const seen = new Set<string>();
  for (const doc of docs) {
    for (const raw of doc.items ?? []) {
      const parsed = parseFeedRow(raw);
      if (!parsed) continue;
      const key = `${parsed.id}|${parsed.createdAt}|${parsed.type}|${parsed.message ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(parsed);
    }
  }
  return out.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function filterNotificationsByDays(
  notifications: Notification[],
  days: number,
): Notification[] {
  const cutoffMs = Date.now() - days * DAY_MS;
  return notifications.filter((n) => {
    const ts = new Date(n.createdAt).getTime();
    return Number.isFinite(ts) && ts >= cutoffMs;
  });
}

export function hasOlderNotifications(
  notifications: Notification[],
  days: number,
): boolean {
  const cutoffMs = Date.now() - days * DAY_MS;
  return notifications.some((n) => {
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
