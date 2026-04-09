import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { client } from "@/src/sanity/lib/client";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

type BundledEvent = Record<string, unknown> & { _key?: string };

const SORT_FIELDS = ["createdAt", "event", "programSlug", "path", "social"] as const;
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

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

/** Parse and validate GET query params */
function parseGetParams(searchParams: URLSearchParams): {
  search?: string;
  programSlug?: string;
  path?: string;
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
} | null {
  const search = searchParams.get("search") ?? undefined;
  const programSlug = searchParams.get("programSlug") ?? undefined;
  const path = searchParams.get("path") ?? undefined;

  const pageRaw = searchParams.get("page") ?? "1";
  const page = Math.max(1, parseInt(pageRaw, 10));
  if (isNaN(page) || page < 1) return null;

  const limitRaw = searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limitRaw, 10)));
  if (isNaN(limit)) return null;

  const sort = searchParams.get("sort") ?? "createdAt";
  if (!SORT_FIELDS.includes(sort as (typeof SORT_FIELDS)[number])) return null;

  const order = (searchParams.get("order") ?? "desc").toLowerCase();
  if (order !== "asc" && order !== "desc") return null;

  // Input validation
  if (search !== undefined && (typeof search !== "string" || search.length > 200)) return null;
  if (programSlug !== undefined && (typeof programSlug !== "string" || programSlug.length > 100)) return null;
  if (path !== undefined && (typeof path !== "string" || path.length > 500)) return null;

  return { search, programSlug, path, page, limit, sort, order };
}

/**
 * GET /api/v1/admin/events
 * List/search events with pagination, filtering, sorting.
 * Admin-only. Rate limited.
 */
export async function GET(req: NextRequest) {
  const { ok: rateOk, remaining } = rateLimitMiddleware(req);
  if (!rateOk) {
    return Errors.tooManyRequests();
  }

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  const params = parseGetParams(req.nextUrl.searchParams);
  if (!params) {
    return Errors.validation("Invalid query parameters", [
      { field: "page", message: "page must be >= 1" },
      { field: "limit", message: `limit must be 1-${MAX_PAGE_SIZE}` },
      { field: "sort", message: `sort must be one of: ${SORT_FIELDS.join(", ")}` },
      { field: "order", message: "order must be asc or desc" }
    ]);
  }

  try {
    const { search, programSlug, path, page, limit, sort, order } = params;

    // Build GROQ filter for singular events
    const term = search ?? "";
    const singularFilter =
      term !== ""
        ? `&& (
          path == $term || programSlug == $term || social == $term || referrer == $term ||
          country == $term || city == $term || keyHash == $term || keyIdentifier == $term ||
          keyNormalized == $term || userAgent == $term || utm_source == $term ||
          utm_medium == $term || utm_campaign == $term
        )`
        : "";
    const programFilter = programSlug ? `&& programSlug == $programSlug` : "";
    const pathFilter = path ? `&& path == $path` : "";

    const singular = await client.fetch<Array<Record<string, unknown> & { _id: string; _type: string }>>(
      `*[_type == "trackingEvent" ${singularFilter} ${programFilter} ${pathFilter}]{
        _id, _type, event, programSlug, social, path, referrer, country, city,
        keyHash, keyIdentifier, keyNormalized, userAgent, ipHash, utm_source, utm_medium, utm_campaign, createdAt
      } | order(${sort} ${order})`,
      { term, programSlug: programSlug ?? "", path: path ?? "" }
    );

    const allBundles = await client.fetch<Array<{ _id: string; events: BundledEvent[] }>>(
      `*[_type == "trackingEventBundle"]{ _id, "events": events[] }`
    );

    const matchingFromBundles: Array<{ bundleId: string; event: BundledEvent }> = [];
    for (const b of allBundles ?? []) {
      for (const e of b.events ?? []) {
        const ev = e as Record<string, unknown>;
        if (matchesFilter(ev, { search: term || undefined, programSlug, path })) {
          matchingFromBundles.push({ bundleId: b._id, event: e });
        }
      }
    }

    // Normalize: singular have _id, bundled have _key + bundleId
    const allEvents = [
      ...(singular ?? []).map(s => ({ ...s, source: "singular" as const })),
      ...matchingFromBundles.map(({ bundleId, event }) => ({
        ...event,
        _id: `${bundleId}#${(event as BundledEvent)._key ?? "0"}`,
        bundleId,
        source: "bundle" as const
      }))
    ];

    // Sort merged (simple in-memory; singular already sorted)
    allEvents.sort((a, b) => {
      const va = (a as Record<string, unknown>)[sort];
      const vb = (b as Record<string, unknown>)[sort];
      if (va == null && vb == null) return 0;
      if (va == null) return order === "asc" ? 1 : -1;
      if (vb == null) return order === "asc" ? -1 : 1;
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return order === "asc" ? cmp : -cmp;
    });

    const total = allEvents.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = allEvents.slice(offset, offset + limit);

    const res = NextResponse.json({
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
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
  filter: { programSlug?: string; path?: string; search?: string };
  patch: { programSlug?: string; path?: string };
} | null {
  if (body == null || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const filter = o.filter as Record<string, unknown> | undefined;
  const patch = o.patch as Record<string, unknown> | undefined;
  if (!filter || typeof filter !== "object" || !patch || typeof patch !== "object") return null;

  const outFilter: { programSlug?: string; path?: string; search?: string } = {};
  if (typeof filter.programSlug === "string" && filter.programSlug.length <= 100)
    outFilter.programSlug = filter.programSlug;
  if (typeof filter.path === "string" && filter.path.length <= 500) outFilter.path = filter.path;
  if (typeof filter.search === "string" && filter.search.length <= 200) outFilter.search = filter.search;

  const outPatch: { programSlug?: string; path?: string } = {};
  if (typeof patch.programSlug === "string" && patch.programSlug.length <= 100)
    outPatch.programSlug = patch.programSlug;
  if (typeof patch.path === "string" && patch.path.length <= 500) outPatch.path = patch.path;

  if (Object.keys(outPatch).length === 0) return null;
  if (Object.keys(outFilter).length === 0) return null; // Require filter to avoid accidental bulk update
  return { filter: outFilter, patch: outPatch };
}

/**
 * PATCH /api/v1/admin/events
 * Bulk update events matching filter. Admin-only.
 * Body: { filter: { programSlug?, path?, search? }, patch: { programSlug?, path?, ... } }
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

    // Singular events: GROQ patch
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
        `(path == $term || programSlug == $term || social == $term || referrer == $term || country == $term || city == $term || keyHash == $term || keyIdentifier == $term || keyNormalized == $term || userAgent == $term || utm_source == $term || utm_medium == $term || utm_campaign == $term)`
      );
      params.term = filter.search;
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

    // Bundled events
    const allBundles = await client.fetch<Array<{ _id: string; events: BundledEvent[] }>>(
      `*[_type == "trackingEventBundle"]{ _id, "events": events[] }`
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

    return NextResponse.json({
      data: { updated },
      meta: {}
    });
  } catch (err) {
    console.error("[PATCH /api/v1/admin/events]", err);
    return Errors.internal();
  }
}
