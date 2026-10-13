import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { GIVEAWAY_IGNORED_ITEMS_ID } from "@/src/lib/giveaways/constants";
import { existingEntriesOf, flagItems, hasSomethingNew, ignoredIdentity, withKeys } from "@/src/lib/giveaways/dedupe";
import { ignoredEntriesQuery, toIgnoredMap, type IgnoredEntryRow } from "@/src/lib/giveaways/ignoredItems";
import { cleanName, compactName, termList, type DiscoveryProgram } from "@/src/lib/giveaways/matchProgram";
import { mutationClient } from "@/src/lib/sanity/mutationClient";
import type {
  GiveawayFindAccount,
  GiveawayFindKey,
  GiveawayFindLink,
  GiveawayIgnoredItemKind,
  GiveawayIgnoreReason
} from "@/src/types/giveaways";

const VALID_STATUSES = ["new", "reviewing", "added", "dismissed"] as const;
const IGNORE_REASONS: GiveawayIgnoreReason[] = ["limit", "invalid", "expired"];
const ITEM_KINDS: GiveawayIgnoredItemKind[] = ["key", "account", "link"];

type ItemRef = { kind: GiveawayIgnoredItemKind; value: string };

type Updates = {
  status?: string;
  notes?: string;
  programId?: string;
  rememberAlias?: boolean;
  ignore?: ItemRef & { reason: GiveawayIgnoreReason };
  unignore?: ItemRef;
};

function parseItemRef(raw: unknown, field: string): ItemRef {
  const r = (raw ?? {}) as Record<string, unknown>;
  if (!ITEM_KINDS.includes(r.kind as GiveawayIgnoredItemKind)) {
    throw new Error(`${field}.kind must be one of: ${ITEM_KINDS.join(", ")}`);
  }
  if (typeof r.value !== "string" || !r.value.trim()) throw new Error(`${field}.value must be a non-empty string`);
  return { kind: r.kind as GiveawayIgnoredItemKind, value: r.value.trim().slice(0, 2000) };
}

function parseUpdates(body: unknown): Updates {
  if (!body || typeof body !== "object") return {};
  const b = body as Record<string, unknown>;
  const out: Updates = {};
  if (typeof b.status === "string") {
    if (!VALID_STATUSES.includes(b.status as (typeof VALID_STATUSES)[number])) {
      throw new Error(`status must be one of: ${VALID_STATUSES.join(", ")}`);
    }
    out.status = b.status;
  }
  if (b.notes !== undefined) {
    if (typeof b.notes !== "string") throw new Error("notes must be a string");
    out.notes = b.notes.slice(0, 2000);
  }
  if (b.programId !== undefined) {
    if (typeof b.programId !== "string" || !b.programId.trim()) throw new Error("programId must be a program id");
    out.programId = b.programId.trim();
  }
  if (b.rememberAlias !== undefined) out.rememberAlias = b.rememberAlias === true;
  if (b.ignore !== undefined) {
    const reason = (b.ignore as Record<string, unknown> | null)?.reason;
    if (!IGNORE_REASONS.includes(reason as GiveawayIgnoreReason)) {
      throw new Error(`ignore.reason must be one of: ${IGNORE_REASONS.join(", ")}`);
    }
    out.ignore = { ...parseItemRef(b.ignore, "ignore"), reason: reason as GiveawayIgnoreReason };
  }
  if (b.unignore !== undefined) out.unignore = parseItemRef(b.unignore, "unignore");
  return out;
}

type ProgramRow = DiscoveryProgram & { giveawayDiscovery?: { aliases?: string[] | null } | null };

type FindRow = {
  _id: string;
  status?: string;
  sourceTitle?: string;
  keys?: GiveawayFindKey[];
  accounts?: GiveawayFindAccount[];
  links?: GiveawayFindLink[];
  program?: ProgramRow | null;
  candidates?: { program?: ProgramRow | null }[] | null;
};

const programFields = `_id, title, giveawayDiscovery, vendor->{name, aliases}, cdKeys[]{key, username, giveawayLinks[]{url}}`;

/**
 * PATCH /api/v1/admin/giveaway-finds/[id] - Update status/notes, assign the find to a program, or
 * ignore/un-ignore one of its keys/accounts.
 * - `programId` re-checks the found keys against that program; `rememberAlias` also saves the source
 *   title as a program alias so the same name matches automatically next time.
 * - `ignore: { kind, value, reason }` adds the key/account/link to the private ignore list so no scan ever
 *   reports it as new again. When the find has nothing new left, it is dismissed.
 * - `unignore: { kind, value }` removes it from the ignore list.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const { id } = await params;
    if (!id) return Errors.badRequest("id is required");

    const body = await req.json().catch(() => ({}));
    const updates = parseUpdates(body);
    if (!Object.keys(updates).length) {
      return Errors.validation(
        "No valid fields to update (allowed: status, notes, programId, rememberAlias, ignore, unignore)"
      );
    }

    const set: Record<string, unknown> = {};
    if (updates.status) set.status = updates.status;
    if (updates.notes !== undefined) set.notes = updates.notes;
    let aliasAdded: string | null = null;

    const touchesItems = Boolean(updates.programId || updates.ignore || updates.unignore);
    if (!touchesItems) {
      // A manual status change replaces any automatic "dismissed by scan" reason.
      const patch = mutationClient.patch(id).set(set);
      await (updates.status ? patch.unset(["dismissedReason"]) : patch).commit();
      return NextResponse.json({ data: { id, updated: Object.keys(set), aliasAdded }, meta: {} });
    }

    const data = await mutationClient.fetch<{
      find: FindRow | null;
      assigned: ProgramRow | null;
      vendors: { name?: string; aliases?: string[] }[];
      ignored: IgnoredEntryRow[] | null;
    }>(
      `{
        "find": *[_type == "giveawayFind" && _id == $id][0]{
          _id, status, sourceTitle,
          keys[]{value, isNew, ignoredReason}, accounts[]{username, password, isNew, ignoredReason}, links[]{url, label, isNew, ignoredReason},
          "program": program->{${programFields}},
          "candidates": candidates[]{"program": program->{${programFields}}}
        },
        "assigned": *[_type == "program" && _id == $programId][0]{${programFields}},
        "vendors": *[_type == "vendor"]{name, aliases},
        "ignored": ${ignoredEntriesQuery}
      }`,
      { id, programId: updates.programId ?? "", ignoredId: GIVEAWAY_IGNORED_ITEMS_ID }
    );
    const find = data?.find;
    if (!find) return Errors.notFound("Giveaway find not found");
    if (updates.programId && !data.assigned) return Errors.validation("programId does not match a published program");

    const tx = mutationClient.transaction();

    // Ignore list changes (private doc, created on first use).
    const ignoredRows = [...(data.ignored ?? [])];
    const program = data.assigned ?? find.program ?? null;
    if (updates.ignore) {
      const identity = ignoredIdentity(updates.ignore.kind, updates.ignore.value);
      const existing = ignoredRows.filter(r => r.kind && r.value && ignoredIdentity(r.kind, r.value) === identity);
      tx.createIfNotExists({ _id: GIVEAWAY_IGNORED_ITEMS_ID, _type: "giveawayIgnoredItems", entries: [] });
      if (existing.length) {
        tx.patch(GIVEAWAY_IGNORED_ITEMS_ID, p =>
          p.set(Object.fromEntries(existing.map(r => [`entries[_key=="${r._key}"].reason`, updates.ignore!.reason])))
        );
        existing.forEach(r => (r.reason = updates.ignore!.reason));
      } else {
        const row = {
          _key: crypto.randomBytes(6).toString("hex"),
          _type: "giveawayIgnoredItem",
          kind: updates.ignore.kind,
          value: updates.ignore.value,
          reason: updates.ignore.reason,
          ...(program && { program: { _type: "reference", _ref: program._id, _weak: true } }),
          ignoredAt: new Date().toISOString()
        };
        tx.patch(GIVEAWAY_IGNORED_ITEMS_ID, p => p.setIfMissing({ entries: [] }).append("entries", [row]));
        ignoredRows.push(row);
      }
    }
    if (updates.unignore) {
      const identity = ignoredIdentity(updates.unignore.kind, updates.unignore.value);
      const removeKeys = ignoredRows
        .filter(r => r.kind && r.value && ignoredIdentity(r.kind, r.value) === identity)
        .map(r => r._key);
      if (removeKeys.length) {
        tx.patch(GIVEAWAY_IGNORED_ITEMS_ID, p => p.unset(removeKeys.map(k => `entries[_key=="${k}"]`)));
      }
      for (let i = ignoredRows.length - 1; i >= 0; i--) {
        if (removeKeys.includes(ignoredRows[i]._key)) ignoredRows.splice(i, 1);
      }
    }

    // Re-check the find's items against its program (or candidates) and the updated ignore list.
    const againstPrograms = program
      ? [program]
      : (find.candidates ?? []).map(c => c.program).filter((p): p is ProgramRow => Boolean(p));
    const flagged = flagItems(
      { keys: find.keys ?? [], accounts: find.accounts ?? [], links: find.links ?? [] },
      againstPrograms.map(existingEntriesOf),
      toIgnoredMap(ignoredRows)
    );
    Object.assign(set, {
      keys: withKeys(flagged.keys, "k"),
      accounts: withKeys(flagged.accounts, "a"),
      links: withKeys(flagged.links, "l")
    });

    // Nothing usable left after ignoring: take it off the "new" list.
    if (updates.ignore && !updates.status && !hasSomethingNew(flagged) && find.status !== "added") {
      set.status = "dismissed";
    }

    if (updates.programId && data.assigned) {
      Object.assign(set, {
        program: { _type: "reference", _ref: data.assigned._id, _weak: true },
        matchMethod: "manual",
        matchConfidence: 1,
        candidates: []
      });

      if (updates.rememberAlias && find.sourceTitle) {
        const vendorTerms = termList((data.vendors ?? []).flatMap(v => [v.name, ...(v.aliases ?? [])]));
        const alias = cleanName(find.sourceTitle, vendorTerms);
        const aliasCompact = alias.replace(/\s+/g, "");
        const known = [data.assigned.title, ...(data.assigned.giveawayDiscovery?.aliases ?? [])].map(a =>
          compactName(a, vendorTerms)
        );
        if (aliasCompact.length >= 3 && !known.includes(aliasCompact)) aliasAdded = alias;
      }
    }

    tx.patch(id, p => p.set(set));
    if (aliasAdded && updates.programId) {
      tx.patch(updates.programId, p =>
        p
          .setIfMissing({ giveawayDiscovery: {} })
          .setIfMissing({ "giveawayDiscovery.aliases": [] })
          .append("giveawayDiscovery.aliases", [aliasAdded])
      );
    }
    await tx.commit();

    return NextResponse.json({
      data: { id, updated: Object.keys(set), aliasAdded, status: (set.status as string | undefined) ?? find.status },
      meta: {}
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update giveaway find";
    if (message.includes("must be")) return Errors.validation(message);
    console.error("[PATCH /api/v1/admin/giveaway-finds/[id]]", err);
    return Errors.internal();
  }
}
