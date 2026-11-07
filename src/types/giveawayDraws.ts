/** Facebook giveaway draws (`analytics.giveaway_draws`), managed on /admin/giveaway-picker. */

export type DrawPrize = {
  id: string;
  name: string;
  /** How many winners this prize gets. */
  qty: number;
  /** Key or code handed to the winners, shown in the announcement. */
  key?: string;
  /** Extra words that count as asking for this prize in a comment ("ASC", "systemcare"). */
  aliases: string[];
};

/** Kept short on purpose: names and the prize ids they asked for. Empty `p` = no prize recognized. */
export type DrawEntrant = { n: string; p: string[] };

export type DrawWinner = { prize: string; name: string; at: string; comment?: string };

export type DrawStatus = "open" | "drawn";

export type GiveawayDraw = {
  id: string;
  title: string;
  kind?: string;
  postUrl?: string;
  status: DrawStatus;
  prizes: DrawPrize[];
  entrants: DrawEntrant[];
  winners: DrawWinner[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  drawnAt?: string;
};

/** List rows: no entrants, but winners so past wins can be flagged. */
export type GiveawayDrawSummary = Pick<
  GiveawayDraw,
  "id" | "title" | "kind" | "status" | "createdAt" | "drawnAt" | "winners"
> & { entrantCount: number; prizeCount: number };

export type GiveawayDrawUpdate = Partial<
  Pick<GiveawayDraw, "title" | "kind" | "postUrl" | "status" | "prizes" | "entrants" | "winners" | "notes">
>;
