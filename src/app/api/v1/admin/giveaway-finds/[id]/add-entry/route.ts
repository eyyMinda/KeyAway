import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { revalidateAfterProgramContentWrite } from "@/src/lib/cache/revalidateProgramContent";
import { existingEntriesOf, flagItems, hasSomethingNew, withKeys } from "@/src/lib/giveaways/dedupe";
import { loadIgnoredItems } from "@/src/lib/giveaways/ignoredItems";
import { isAccountFlow, isKeyLikeFlow, isLinkAccountFlow, normalizeProgramFlow } from "@/src/lib/program/activationEntry";
import { mutationClient } from "@/src/lib/sanity/mutationClient";
import { validateCdKeyStatusValue, validateProgramActivationEntries } from "@/src/sanity/validators/program";
import type { GiveawayFindAccount, GiveawayFindKey, GiveawayFindLink } from "@/src/types/giveaways";
import type { CDKey, CDKeyStatus } from "@/src/types/program";

type EntryInput = {
  key?: unknown;
  status?: unknown;
  version?: unknown;
  validFrom?: unknown;
  validUntil?: unknown;
  accountLabel?: unknown;
  username?: unknown;
  password?: unknown;
  giveawayLinks?: unknown;
};

const str = (v: unknown, max = 500) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);

function isoOrUndefined(v: unknown, field: string): string | undefined {
  const s = str(v, 40);
  if (!s) return undefined;
  const ms = Date.parse(s);
  if (Number.isNaN(ms)) throw new Error(`${field} must be a valid date`);
  return new Date(ms).toISOString();
}

type ProgramRow = {
  _id: string;
  title: string;
  slug?: string;
  programFlow?: string;
  cdKeys?: CDKey[] | null;
};

type FindRow = {
  _id: string;
  status?: string;
  keys?: GiveawayFindKey[];
  accounts?: GiveawayFindAccount[];
  links?: GiveawayFindLink[];
  program?: ProgramRow | null;
  hasDraft?: boolean;
};

/**
 * POST /api/v1/admin/giveaway-finds/[id]/add-entry - Append an activation entry (key / account / links,
 * matching the program's activation flow) to the find's program. Body: `{ entry: { … } }` as edited in
 * the admin modal. Re-checks the find afterwards and marks it added when nothing new is left on it.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const { id } = await params;
    if (!id) return Errors.badRequest("id is required");
    const body = (await req.json().catch(() => ({}))) as { entry?: EntryInput };
    const input = body.entry ?? {};

    const find = await mutationClient.fetch<FindRow | null>(
      `*[_type == "giveawayFind" && _id == $id][0]{
        _id, status,
        keys[]{value, isNew, ignoredReason}, accounts[]{username, password, isNew, ignoredReason}, links[]{url, label, isNew, ignoredReason},
        "program": program->{_id, title, "slug": slug.current, programFlow, cdKeys},
        "hasDraft": defined(*[_id == "drafts." + ^.program._ref][0]._id)
      }`,
      { id }
    );
    if (!find) return Errors.notFound("Giveaway find not found");
    const program = find.program;
    if (!program) return Errors.validation("Assign the find to a program first");

    const flow = normalizeProgramFlow(program.programFlow);
    const status = str(input.status, 20) ?? "new";
    const statusCheck = validateCdKeyStatusValue(status);
    if (statusCheck !== true) return Errors.validation(statusCheck);

    const row: Record<string, unknown> = {
      _key: crypto.randomBytes(6).toString("hex"),
      _type: "cdKey",
      status: status as CDKeyStatus,
      createdAt: new Date().toISOString()
    };
    const version = str(input.version, 60);
    if (version) row.version = version;
    const validFrom = isoOrUndefined(input.validFrom, "validFrom");
    if (validFrom) row.validFrom = validFrom;
    const validUntil = isoOrUndefined(input.validUntil, "validUntil");
    if (validUntil) row.validUntil = validUntil;

    if (isKeyLikeFlow(flow)) {
      const key = str(input.key, 200);
      if (!key) return Errors.validation("key is required for this activation flow");
      row.key = key;
    } else if (isAccountFlow(flow)) {
      const username = str(input.username, 200);
      const password = str(input.password, 200);
      if (!username || !password) return Errors.validation("username and password are required for account flow");
      row.username = username;
      row.password = password;
      const label = str(input.accountLabel, 120);
      if (label) row.accountLabel = label;
    } else if (isLinkAccountFlow(flow)) {
      const links = (Array.isArray(input.giveawayLinks) ? input.giveawayLinks : [])
        .map(l => l as Record<string, unknown>)
        .map((l, i) => ({
          _key: `l${i}${crypto.randomBytes(3).toString("hex")}`,
          _type: "giveawayLink",
          title: str(l.title, 120),
          url: str(l.url, 2000),
          note: str(l.note, 200)
        }))
        .filter(l => l.url);
      if (!links.length || links.some(l => !l.title)) {
        return Errors.validation("add at least one giveaway link, each with a title and URL");
      }
      for (const l of links) {
        try {
          new URL(l.url!);
        } catch {
          return Errors.validation(`invalid URL: ${l.url}`);
        }
      }
      row.giveawayLinks = links.map(l => Object.fromEntries(Object.entries(l).filter(([, v]) => v !== undefined)));
    }

    // Same validator as Studio: required fields per flow and no duplicate rows within the program.
    const check = validateProgramActivationEntries([...(program.cdKeys ?? []), row], flow);
    if (check !== true) return Errors.validation(check.replace(/^Row #\d+: /, ""));

    const tx = mutationClient
      .transaction()
      .patch(program._id, p => p.setIfMissing({ cdKeys: [] }).append("cdKeys", [row]));
    // An unpublished Studio draft would otherwise drop this entry when it gets published.
    if (find.hasDraft) {
      tx.patch(`drafts.${program._id}`, p => p.setIfMissing({ cdKeys: [] }).append("cdKeys", [row]));
    }

    // Re-check the find against the program including the new entry.
    const ignored = await loadIgnoredItems();
    const flagged = flagItems(
      { keys: find.keys ?? [], accounts: find.accounts ?? [], links: find.links ?? [] },
      [existingEntriesOf({ cdKeys: [...(program.cdKeys ?? []), row as unknown as CDKey] })],
      ignored
    );
    // Done when the page had nothing else to offer, or everything on it is now on the program/ignored.
    const done = !hasAnyItem(flagged) || !hasSomethingNew(flagged);
    tx.patch(id, p =>
      p.set({
        keys: withKeys(flagged.keys, "k"),
        accounts: withKeys(flagged.accounts, "a"),
        links: withKeys(flagged.links, "l"),
        ...(done && { status: "added" })
      })
    );
    await tx.commit();

    revalidateAfterProgramContentWrite({ slug: program.slug });

    return NextResponse.json(
      {
        data: {
          programId: program._id,
          programTitle: program.title,
          entryKey: row._key,
          findStatus: done ? "added" : find.status
        },
        meta: {}
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add activation entry";
    if (message.includes("must be")) return Errors.validation(message);
    console.error("[POST /api/v1/admin/giveaway-finds/[id]/add-entry]", err);
    return Errors.internal();
  }
}

function hasAnyItem(items: { keys: unknown[]; accounts: unknown[]; links: unknown[] }): boolean {
  return items.keys.length + items.accounts.length + items.links.length > 0;
}
