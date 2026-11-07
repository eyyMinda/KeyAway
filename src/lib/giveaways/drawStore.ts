/** @fileoverview `analytics.giveaway_draws`: Facebook giveaways, their entrants and the winners picked (admin only). */
import { db } from "@/src/lib/db/postgres";
import type {
  DrawEntrant,
  DrawPrize,
  DrawWinner,
  GiveawayDraw,
  GiveawayDrawSummary,
  GiveawayDrawUpdate
} from "@/src/types/giveawayDraws";

export const MAX_DRAW_ENTRANTS = 5000;
const MAX_PRIZES = 50;
const MAX_NAME = 80;
const MAX_COMMENT = 280;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const text = (value: unknown, max: number) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;

type Row = {
  id: string;
  title: string;
  kind: string | null;
  postUrl: string | null;
  status: GiveawayDraw["status"];
  prizes: DrawPrize[];
  entrants: DrawEntrant[];
  winners: DrawWinner[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  drawnAt: string | null;
};

const toDraw = (row: Row): GiveawayDraw => ({
  id: row.id,
  title: row.title,
  kind: row.kind ?? undefined,
  postUrl: row.postUrl ?? undefined,
  status: row.status,
  prizes: row.prizes,
  entrants: row.entrants,
  winners: row.winners,
  notes: row.notes ?? undefined,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  drawnAt: row.drawnAt ?? undefined
});

/** Validates and trims an update body; throws with a message for the API to return. */
export function parseDrawUpdate(body: unknown): GiveawayDrawUpdate {
  if (!body || typeof body !== "object") return {};
  const b = body as Record<string, unknown>;
  const out: GiveawayDrawUpdate = {};

  if (b.title !== undefined) {
    const title = text(b.title, 120);
    if (!title) throw new Error("title cannot be empty");
    out.title = title;
  }
  if (b.kind !== undefined) out.kind = text(b.kind, 60);
  if (b.postUrl !== undefined) {
    const url = text(b.postUrl, 500);
    if (url && !/^https?:\/\//i.test(url)) throw new Error("postUrl must be a link");
    out.postUrl = url;
  }
  if (b.notes !== undefined) out.notes = text(b.notes, 2000);
  if (b.status !== undefined) {
    if (b.status !== "open" && b.status !== "drawn") throw new Error("status must be open or drawn");
    out.status = b.status;
  }
  if (b.prizes !== undefined) {
    if (!Array.isArray(b.prizes) || b.prizes.length > MAX_PRIZES)
      throw new Error(`prizes must be a list (max ${MAX_PRIZES})`);
    out.prizes = b.prizes.map((raw, i) => {
      const p = (raw ?? {}) as Record<string, unknown>;
      const name = text(p.name, 120);
      if (!name) throw new Error(`prize ${i + 1} needs a name`);
      return {
        id: text(p.id, 40) ?? `p${i + 1}`,
        name,
        qty: Math.min(100, Math.max(1, Math.floor(Number(p.qty) || 1))),
        ...(text(p.key, 120) ? { key: text(p.key, 120) } : {}),
        aliases: Array.isArray(p.aliases) ? p.aliases.flatMap(a => text(a, 40) ?? []).slice(0, 10) : []
      };
    });
  }
  if (b.entrants !== undefined) {
    if (!Array.isArray(b.entrants) || b.entrants.length > MAX_DRAW_ENTRANTS) {
      throw new Error(`entrants must be a list (max ${MAX_DRAW_ENTRANTS})`);
    }
    out.entrants = b.entrants.flatMap(raw => {
      const e = (raw ?? {}) as Record<string, unknown>;
      const n = text(e.n, MAX_NAME);
      return n ? [{ n, p: Array.isArray(e.p) ? e.p.flatMap(id => text(id, 40) ?? []) : [] }] : [];
    });
  }
  if (b.winners !== undefined) {
    if (!Array.isArray(b.winners) || b.winners.length > 1000) throw new Error("winners must be a list");
    out.winners = b.winners.flatMap(raw => {
      const w = (raw ?? {}) as Record<string, unknown>;
      const prize = text(w.prize, 40);
      const name = text(w.name, MAX_NAME);
      if (!prize || !name) return [];
      const at = typeof w.at === "string" && !Number.isNaN(Date.parse(w.at)) ? w.at : new Date().toISOString();
      const comment = text(w.comment, MAX_COMMENT);
      return [{ prize, name, at, ...(comment ? { comment } : {}) }];
    });
  }
  return out;
}

export async function listDraws(): Promise<GiveawayDrawSummary[]> {
  const rows = await db()<Array<GiveawayDrawSummary & { kind: string | null; drawnAt: string | null }>>`
    select id, title, kind, status, created_at, drawn_at, winners,
           jsonb_array_length(entrants)::int as entrant_count, jsonb_array_length(prizes)::int as prize_count
    from analytics.giveaway_draws
    order by created_at desc
  `;
  return rows.map(r => ({ ...r, kind: r.kind ?? undefined, drawnAt: r.drawnAt ?? undefined }));
}

export async function getDraw(id: string): Promise<GiveawayDraw | null> {
  if (!UUID_RE.test(id)) return null;
  const [row] = await db()<Row[]>`select * from analytics.giveaway_draws where id = ${id}`;
  return row ? toDraw(row) : null;
}

export async function createDraw(input: GiveawayDrawUpdate & { title: string }): Promise<GiveawayDraw> {
  const sql = db();
  const [row] = await sql<Row[]>`
    insert into analytics.giveaway_draws (title, kind, post_url, prizes, entrants, notes)
    values (${input.title}, ${input.kind ?? null}, ${input.postUrl ?? null}, ${sql.json(input.prizes ?? [])},
            ${sql.json(input.entrants ?? [])}, ${input.notes ?? null})
    returning *
  `;
  return toDraw(row);
}

export async function updateDraw(id: string, update: GiveawayDrawUpdate): Promise<GiveawayDraw | null> {
  if (!UUID_RE.test(id)) return null;
  const sql = db();
  const set: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (update.title !== undefined) set.title = update.title;
  if ("kind" in update) set.kind = update.kind ?? null;
  if ("postUrl" in update) set.post_url = update.postUrl ?? null;
  if ("notes" in update) set.notes = update.notes ?? null;
  if (update.prizes) set.prizes = sql.json(update.prizes);
  if (update.entrants) set.entrants = sql.json(update.entrants);
  if (update.winners) set.winners = sql.json(update.winners);
  if (update.status) {
    set.status = update.status;
    set.drawn_at = update.status === "drawn" ? new Date().toISOString() : null;
  }
  const [row] = await sql<Row[]>`
    update analytics.giveaway_draws set ${sql(set)} where id = ${id} returning *
  `;
  return row ? toDraw(row) : null;
}

export async function deleteDraw(id: string): Promise<boolean> {
  if (!UUID_RE.test(id)) return false;
  const rows = await db()`delete from analytics.giveaway_draws where id = ${id} returning id`;
  return rows.length > 0;
}
