/** @fileoverview Private message for a giveaway winner with their prize keys (client-safe). */
import { entrantKey } from "@/src/lib/giveaways/parseGiveawayComments";
import type { DrawPrize, DrawWinner } from "@/src/types/giveawayDraws";

export type WinnerMessageOptions = {
  /** How long the keys work, e.g. "14 months". Empty leaves the sentence out. */
  validity: string;
  /** Closing emoji, e.g. 👻 for Halloween. */
  signOff: string;
};

export type WinnerPrizes = { name: string; prizes: DrawPrize[] };

const COUNT_WORDS = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/** Prize names may start with an emoji ("🛡️ Advanced SystemCare Pro"); messages use the plain name. */
const plainName = (prize: DrawPrize) => prize.name.replace(/^[^\p{L}\p{N}]+/u, "").trim() || prize.name;

/** One entry per person, in draw order, with every prize they won. */
export function groupWinners(winners: DrawWinner[], prizes: DrawPrize[]): WinnerPrizes[] {
  const byKey = new Map<string, WinnerPrizes>();
  for (const winner of winners) {
    const prize = prizes.find(p => p.id === winner.prize);
    if (!prize) continue;
    const key = entrantKey(winner.name);
    const entry = byKey.get(key) ?? { name: winner.name, prizes: [] };
    entry.prizes.push(prize);
    byKey.set(key, entry);
  }
  return [...byKey.values()];
}

export function buildWinnerMessage(
  { name, prizes }: WinnerPrizes,
  giveawayTitle: string,
  { validity, signOff }: WinnerMessageOptions
): string {
  const single = prizes.length === 1;
  const keyOf = (prize: DrawPrize) => prize.key?.trim() || "[KEY]";
  const won = single ? plainName(prizes[0]) : `${COUNT_WORDS[prizes.length] ?? prizes.length} programs`;
  const keys = single
    ? ["Here's your license key:", keyOf(prizes[0])]
    : prizes.map(prize => `${plainName(prize)}: ${keyOf(prize)}`);
  const open = single ? plainName(prizes[0]) : "the program";
  const activate = `To activate it, open ${open}, click "Enter Code" or "Activate", then paste in the key.${
    validity.trim() ? ` It's valid for ${validity.trim()}.` : ""
  }`;
  const share = single
    ? "Please don't share this key, as it's just for you."
    : "Please don't share these keys, as they're just for you.";

  return [
    `Hi ${name}! 🎉`,
    "",
    `Congratulations, you won ${won} in the KeyAway ${giveawayTitle} giveaway!`,
    "",
    ...keys,
    "",
    activate,
    "",
    `${share} If you have any trouble activating it, reply here and we'll help.`,
    "",
    `Thank you for being part of KeyAway!${signOff.trim() ? ` ${signOff.trim()}` : ""}`
  ].join("\n");
}
