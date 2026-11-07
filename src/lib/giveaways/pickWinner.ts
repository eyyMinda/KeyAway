/** @fileoverview Random winner selection for giveaway draws (client-safe). */
import { entrantKey } from "@/src/lib/giveaways/parseGiveawayComments";
import type { DrawEntrant, DrawWinner } from "@/src/types/giveawayDraws";

export type PickOptions = {
  /** Skip people who already won another prize in this giveaway while someone else is left. */
  preferNewInDraw: boolean;
  /** Skip people who won in earlier giveaways while someone else is left. */
  avoidPastWinners: boolean;
};

/** Uniform random index from the browser's CSPRNG (no modulo bias). */
export function randomIndex(length: number): number {
  const limit = Math.floor(0x1_0000_0000 / length) * length;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % length;
}

/** Entrants who can still win `prizeId`: asked for it and have not won it yet. */
export function eligibleFor(prizeId: string, entrants: DrawEntrant[], winners: DrawWinner[]): DrawEntrant[] {
  const wonThis = new Set(winners.filter(w => w.prize === prizeId).map(w => entrantKey(w.name)));
  return entrants.filter(e => e.p.includes(prizeId) && !wonThis.has(entrantKey(e.n)));
}

/**
 * Narrows the pool step by step (first-time winners in this draw, then people new to past giveaways) but never to
 * nobody: a preference that would leave no one is skipped. Returns the pool the winner is drawn from.
 */
export function drawPool(
  prizeId: string,
  entrants: DrawEntrant[],
  winners: DrawWinner[],
  pastWinnerKeys: Set<string>,
  options: PickOptions
): DrawEntrant[] {
  let pool = eligibleFor(prizeId, entrants, winners);
  if (options.preferNewInDraw) {
    const wonHere = new Set(winners.map(w => entrantKey(w.name)));
    const fresh = pool.filter(e => !wonHere.has(entrantKey(e.n)));
    if (fresh.length) pool = fresh;
  }
  if (options.avoidPastWinners) {
    const fresh = pool.filter(e => !pastWinnerKeys.has(entrantKey(e.n)));
    if (fresh.length) pool = fresh;
  }
  return pool;
}

export function pickWinner(
  prizeId: string,
  entrants: DrawEntrant[],
  winners: DrawWinner[],
  pastWinnerKeys: Set<string>,
  options: PickOptions
): DrawEntrant | null {
  const pool = drawPool(prizeId, entrants, winners, pastWinnerKeys, options);
  return pool.length ? pool[randomIndex(pool.length)] : null;
}
