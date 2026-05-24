import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { client } from "@/src/sanity/lib/client";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { enrichEventsWithVisitorMeta } from "@/src/lib/analytics/enrichEventsWithVisitorMeta";
import {
  getMergedEventsForAdmin,
  invalidateMergedEventsCache
} from "@/src/lib/api/adminEventsListCache";
import { AnalyticsEventData } from "@/src/types";

type BundledEvent = Record<string, unknown> & { _key?: string };

const SORT_FIELDS = ["createdAt", "event", "programSlug", "path", "social"] as const;
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 25;

function eventHasStringValue(event: Record<string, unknown>, search: string): boolean {
  for (const v of Object.values(event)) {
    if (typeof v === "string" && v === search) return true;
  }
  return false;
}

function matchesFilter(
  ev: Record<string, unknown>,
  filter: { programSlug?: string; path?: string; search?: string }
): boolean {
  if (filter.programSlug !== undefined && ev.programSlug !== filter.programSlug) return false;
  if (filter.path !== undefined && ev.path !== filter.path) return false;
  if (filter.search !== undefined && filter.search !== "" && !eventHasStringValue(ev, filter.search)) return false;
  return true;
}

function countsByEventFrom(events: AnalyticsEventData[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of events) {
    out[e.event] = (out[e.event] ?? 0) + 1;
  }
  return out;
}

function sortEvents(
  events: AnalyticsEventData[],
  sort: (typeof SORT_FIELDS)[number],
  order: "asc" | "desc"
): AnalyticsEventData[] {
  const sorted = [...events];
  sorted.sort((a, b) => {
    const va = a[sort as keyof AnalyticsEventData];
    const vb = b[sort as keyof AnalyticsEventData];
    if (va == null && vb == null) return 0;
    if (va == null) return order === "asc" ? 1 : -1;
    if (vb == null) return order === "asc" ? -1 : 1;
    const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
    return order === "asc" ? cmp : -cmp;
  });
  return sorted;
}

function parseRangeParams(searchParams: URLSearchParams): { since: string; until: string } | null {
  const sinceRaw = searchParams.get("since");
  const untilRaw = searchParams.get("until");
  if (!sinceRaw || !untilRaw) return null;
  const sinceDate = new Date(sinceRaw);
  const untilDate = new Date(untilRaw);
  if (isNaN(sinceDate.getTime()) || isNaN(untilDate.getTime())) return null;
  return { since: sinceDate.toISOString(), until: untilDate.toISOString() };
}

function parseGetParams(searchParams: URLSearchParams): {
  since: string;
  until: string;
  event?: string;
  page: number;
  limit: number;
  sort: (typeof SORT_FIELDS)[number];
  order: "asc" | "desc";
  refresh: boolean;
} | null {
  const range = parseRangeParams(searchParams);
  if (!range) return null;

  const event = searchParams.get("event") ?? undefined;
  if (event !== undefined && (typeof event !== "string" || event.length > 100)) return null;

  const pageRaw = searchParams.get("page") ?? "1";
  const page = Math.max(1, parseInt(pageRaw, 10));
  if (isNaN(page) || page < 1) return null;

  const limitRaw = searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limitRaw, 10)));
  if (isNaN(limit)) return null;

  let sort = (searchParams.get("sort") ?? "createdAt") as (typeof SORT_FIELDS)[number];
  if (sort === ("timestamp" as typeof sort)) sort = "createdAt";
  if (!SORT_FIELDS.includes(sort)) return null;

  const order = (searchParams.get("order") ?? "desc").toLowerCase();
  if (order !== "asc" && order !== "desc") return null;

  const refresh = searchParams.get("refresh") === "true";

  return { ...range, event, page, limit, sort, order, refresh };
}

/**
 * GET /api/v1/admin/events
 * Paginated events for a date range. Merged list cached ~120s; refresh=true bypasses cache.
 */
export async function GET(req: NextRequest) {
  const { ok: rateOk, remaining } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  const params = parseGetParams(req.nextUrl.searchParams);
  if (!params) {
    return Errors.validation("Invalid query parameters", [
      { field: "since", message: "since and until are required ISO dates" },
      { field: "page", message: "page must be >= 1" },
      { field: "limit", message: `limit must be 1-${MAX_PAGE_SIZE}` },
      { field: "sort", message: `sort must be one of: ${SORT_FIELDS.join(", ")}` },
      { field: "order", message: "order must be asc or desc" }
    ]);
  }

  try {
    const { since, until, event, page, limit, sort, order, refresh } = params;

    const { events: merged, cacheHit, cachedAt } = await getMergedEventsForAdmin(since, until, {
      bypass: refresh
    });

    const countsByEvent = countsByEventFrom(merged);
    const filtered = event && event !== "all" ? merged.filter(e => e.event === event) : merged;

    const sorted = sortEvents(filtered, sort, order);
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const pageSlice = sorted.slice(offset, offset + limit);

    const enriched = (await enrichEventsWithVisitorMeta(
      pageSlice as unknown as Array<Record<string, unknown>>
    )) as unknown as AnalyticsEventData[];

    const res = NextResponse.json({
      data: enriched,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
        countsByEvent,
        cacheHit,
        cachedAt
      }
    });
    res.headers.set("X-RateLimit-Remaining", String(remaining));
    return res;
  } catch (err) {
    console.error("[GET /api/v1/admin/events]", err);
    return Errors.internal();
  }
}

/** Parse and validate PATCH body */
function parsePatchBody(body: unknown): {
  filter: { programSlug?: string; path?: string; search?: string; since?: string; until?: string };
  patch: { programSlug?: string; path?: string };
} | null {
  if (body == null || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const filter = o.filter as Record<string, unknown> | undefined;
  const patch = o.patch as Record<string, unknown> | undefined;
  if (!filter || typeof filter !== "object" || !patch || typeof patch !== "object") return null;

  const outFilter: {
    programSlug?: string;
    path?: string;
    search?: string;
    since?: string;
    until?: string;
  } = {};
  if (typeof filter.programSlug === "string" && filter.programSlug.length <= 100)
    outFilter.programSlug = filter.programSlug;
  if (typeof filter.path === "string" && filter.path.length <= 500) outFilter.path = filter.path;
  if (typeof filter.search === "string" && filter.search.length <= 200) outFilter.search = filter.search;
  if (typeof filter.since === "string") outFilter.since = filter.since;
  if (typeof filter.until === "string") outFilter.until = filter.until;

  const outPatch: { programSlug?: string; path?: string } = {};
  if (typeof patch.programSlug === "string" && patch.programSlug.length <= 100)
    outPatch.programSlug = patch.programSlug;
  if (typeof patch.path === "string" && patch.path.length <= 500) outPatch.path = patch.path;

  if (Object.keys(outPatch).length === 0) return null;
  if (Object.keys(outFilter).length === 0) return null;
  return { filter: outFilter, patch: outPatch };
}

/**
 * PATCH /api/v1/admin/events
 * Bulk update events matching filter. Admin-only.
 */
export async function PATCH(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Errors.validation("Invalid JSON body");
  }

  const parsed = parsePatchBody(body);
  if (!parsed) {
    return Errors.validation(
      "Body must include filter (programSlug, path, or search) and patch (programSlug and/or path)."
    );
  }

  const { filter, patch } = parsed;

  try {
    let updated = 0;

    const groqFilterParts: string[] = ["_type == 'trackingEvent'"];
    const params: Record<string, string> = {};
    if (filter.programSlug) {
      groqFilterParts.push("programSlug == $filterProgramSlug");
      params.filterProgramSlug = filter.programSlug;
    }
    if (filter.path) {
      groqFilterParts.push("path == $filterPath");
      params.filterPath = filter.path;
    }
    if (filter.search) {
      groqFilterParts.push(
        `(path == $term || programSlug == $term || social == $term || referrer == $term || country == $term || city == $term)`
      );
      params.term = filter.search;
    }
    if (filter.since) {
      groqFilterParts.push("createdAt >= $since");
      params.since = new Date(filter.since).toISOString();
    }
    if (filter.until) {
      groqFilterParts.push("createdAt <= $until");
      params.until = new Date(filter.until).toISOString();
    }

    const singularIds = await client.fetch<string[]>(`*[${groqFilterParts.join(" && ")}]._id`, params);

    for (const id of singularIds ?? []) {
      const tx = client.transaction().patch(id, p => {
        let patchBuilder = p;
        if (patch.programSlug !== undefined) patchBuilder = patchBuilder.set({ programSlug: patch.programSlug });
        if (patch.path !== undefined) patchBuilder = patchBuilder.set({ path: patch.path });
        return patchBuilder;
      });
      await tx.commit();
      updated++;
    }

    const bundleFilter =
      filter.since && filter.until
        ? `*[_type == "trackingEventBundle" && timeRangeEnd >= $since && timeRangeStart <= $until]{ _id, "events": events[] }`
        : `*[_type == "trackingEventBundle"]{ _id, "events": events[] }`;
    const bundleParams =
      filter.since && filter.until
        ? { since: new Date(filter.since).toISOString(), until: new Date(filter.until).toISOString() }
        : {};

    const allBundles = await client.fetch<Array<{ _id: string; events: BundledEvent[] }>>(
      bundleFilter,
      bundleParams
    );

    for (const b of allBundles ?? []) {
      const afterEvents = (b.events ?? []).map(e => {
        const ev = e as Record<string, unknown>;
        if (!matchesFilter(ev, filter)) return e;
        updated++;
        return {
          ...ev,
          ...(patch.programSlug !== undefined && { programSlug: patch.programSlug }),
          ...(patch.path !== undefined && { path: patch.path })
        };
      });
      if (afterEvents.some((e, i) => e !== (b.events ?? [])[i])) {
        await client.patch(b._id).set({ events: afterEvents, eventCount: afterEvents.length }).commit();
      }
    }

    if (filter.since && filter.until) {
      invalidateMergedEventsCache(
        new Date(filter.since).toISOString(),
        new Date(filter.until).toISOString()
      );
    } else {
      invalidateMergedEventsCache();
    }

    return NextResponse.json({
      data: { updated },
      meta: {}
    });
  } catch (err) {
    console.error("[PATCH /api/v1/admin/events]", err);
    return Errors.internal();
  }
}
