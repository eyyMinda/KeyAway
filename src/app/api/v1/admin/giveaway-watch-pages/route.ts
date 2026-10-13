import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { GIVEAWAY_DISCOVERY_SETTINGS_ID } from "@/src/lib/giveaways/constants";
import { normalizeUrl } from "@/src/lib/giveaways/matchProgram";
import { mutationClient } from "@/src/lib/sanity/mutationClient";

type SettingsRow = {
  published?: { watchPages?: { _key: string; url?: string }[] } | null;
  hasDraft?: boolean;
};

const settingsQuery = `{
  "published": *[_id == $id][0]{watchPages[]{_key, url}},
  "hasDraft": defined(*[_id == "drafts." + $id][0]._id)
}`;

/**
 * POST /api/v1/admin/giveaway-watch-pages - Add a watch page `{ programId, url }` to the private
 * giveaway discovery settings (no-op when the URL is already watched).
 */
export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const body = (await req.json().catch(() => ({}))) as { programId?: unknown; url?: unknown };
    const programId = typeof body.programId === "string" ? body.programId.trim() : "";
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!programId) return Errors.validation("programId is required");
    try {
      if (!/^https?:$/.test(new URL(url).protocol)) throw new Error();
    } catch {
      return Errors.validation("url must be an http(s) URL");
    }

    const [settings, program] = await Promise.all([
      mutationClient.fetch<SettingsRow>(settingsQuery, { id: GIVEAWAY_DISCOVERY_SETTINGS_ID }),
      mutationClient.fetch<string | null>(`*[_type == "program" && _id == $programId][0]._id`, { programId })
    ]);
    if (!program) return Errors.validation("programId does not match a published program");

    const normalized = normalizeUrl(url);
    if ((settings?.published?.watchPages ?? []).some(w => w.url && normalizeUrl(w.url) === normalized)) {
      return NextResponse.json({ data: { added: false, reason: "already watched" }, meta: {} });
    }

    const row = {
      _key: crypto.createHash("sha1").update(normalized).digest("hex").slice(0, 12),
      _type: "giveawayWatchPage",
      program: { _type: "reference", _ref: programId, _weak: true },
      url
    };
    const tx = mutationClient
      .transaction()
      .createIfNotExists({ _id: GIVEAWAY_DISCOVERY_SETTINGS_ID, _type: "giveawayDiscoverySettings" })
      .patch(GIVEAWAY_DISCOVERY_SETTINGS_ID, p => p.setIfMissing({ watchPages: [] }).append("watchPages", [row]));
    // Keep an unpublished Studio draft in sync, or publishing it would drop the new page.
    if (settings?.hasDraft) {
      tx.patch(`drafts.${GIVEAWAY_DISCOVERY_SETTINGS_ID}`, p =>
        p.setIfMissing({ watchPages: [] }).append("watchPages", [row])
      );
    }
    await tx.commit();

    return NextResponse.json({ data: { added: true, key: row._key }, meta: {} }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/v1/admin/giveaway-watch-pages]", err);
    return Errors.internal();
  }
}

/** DELETE /api/v1/admin/giveaway-watch-pages?key=<_key> - Remove a watch page from the private settings. */
export async function DELETE(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const key = req.nextUrl.searchParams.get("key")?.trim() ?? "";
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(key)) return Errors.validation("key is required");

    const settings = await mutationClient.fetch<SettingsRow>(settingsQuery, { id: GIVEAWAY_DISCOVERY_SETTINGS_ID });
    if (!(settings?.published?.watchPages ?? []).some(w => w._key === key)) {
      return Errors.notFound("Watch page not found");
    }

    const tx = mutationClient
      .transaction()
      .patch(GIVEAWAY_DISCOVERY_SETTINGS_ID, p => p.unset([`watchPages[_key=="${key}"]`]));
    if (settings?.hasDraft) {
      tx.patch(`drafts.${GIVEAWAY_DISCOVERY_SETTINGS_ID}`, p => p.unset([`watchPages[_key=="${key}"]`]));
    }
    await tx.commit();

    return NextResponse.json({ data: { removed: true, key }, meta: {} });
  } catch (err) {
    console.error("[DELETE /api/v1/admin/giveaway-watch-pages]", err);
    return Errors.internal();
  }
}
