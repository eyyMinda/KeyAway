/**
 * @fileoverview Turns comments copied from a Facebook post (or a plain "Name: comment" list) into giveaway entrants,
 * and matches each comment to the prizes it asks for. Facebook offers no API for group posts, so the admin selects
 * the comments on the post, copies them and pastes them here. Client-safe.
 */
import type { DrawPrize } from "@/src/types/giveawayDraws";

export type ParsedComment = { name: string; comment: string };

/** Lines Facebook puts between comments: timestamps, actions, sort controls. They end the comment before them. */
const SEPARATOR_PATTERNS = [
  /^\d+\s?(s|m|h|d|w|y|min|mins|hr|hrs|wk|wks|yr|yrs)$/i,
  /^(just now|yesterday)$/i,
  /^(like|reply|share|edited|hide|report|see translation|translate|see original|rate this translation)$/i,
  /^view (all )?\d* ?(more )?(comments?|repl(y|ies))$/i,
  /^view all \d+ repl(y|ies)$/i,
  /^\d+ repl(y|ies)$/i,
  /^(most relevant|newest|all comments|top comments)$/i,
  /^write (a|an) (public )?(comment|answer|reply)…?\.{0,3}$/i,
  /^press enter to post\.?$/i,
  /^\d+$/
];

/** Badges Facebook shows next to a name; skipped without ending the comment. */
const BADGE_PATTERNS = [
  /^(top fan|author|admin|moderator|follow|·|top contributor|rising contributor|group expert|conversation starter|new member|valued commenter|visual storyteller|community expert)$/i,
  /^see more$/i
];

const isSeparator = (line: string) => SEPARATOR_PATTERNS.some(p => p.test(line));
const isBadge = (line: string) => BADGE_PATTERNS.some(p => p.test(line));

/** "Name: comment" or "Name<TAB>comment" per line, when most lines look like that. */
function parseDelimitedList(lines: string[]): ParsedComment[] | null {
  const pattern = /^([^:\t]{2,60})[:\t]\s*(.*)$/;
  const matches = lines.map(line => line.match(pattern));
  if (matches.filter(Boolean).length < Math.max(2, lines.length * 0.6)) return null;
  return matches.flatMap(m => (m ? [{ name: m[1].trim(), comment: m[2].trim() }] : []));
}

/**
 * Parses pasted comments. In Facebook's copy, each comment is a block: the author's name, then the comment text,
 * ended by its timestamp / Like / Reply lines.
 */
export function parseGiveawayComments(raw: string): ParsedComment[] {
  const lines = raw
    .split(/\r?\n/)
    .map(line => line.replace(/​/g, "").trim())
    .filter(Boolean);
  if (!lines.length) return [];

  const delimited = parseDelimitedList(lines);
  if (delimited) return delimited;

  const out: ParsedComment[] = [];
  let block: string[] = [];
  const flush = () => {
    const [name, ...text] = block;
    if (name && name.length <= 80) out.push({ name, comment: text.join(" ").trim() });
    block = [];
  };
  for (const line of lines) {
    if (isSeparator(line)) flush();
    else if (!isBadge(line)) block.push(line);
  }
  flush();
  return out;
}

/** Lower-case, accents dropped, anything but letters and digits (any script) as single spaces, padded for word matches. */
const normalize = (text: string) =>
  ` ${text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()} `;

const EDITION_SUFFIX = /\s+(pro|premium|ultimate|plus|free|standard|professional)$/i;

/** Phrases that count as asking for a prize: its name, the name without the edition, and the admin's aliases. */
export function prizeMatchTerms(prize: Pick<DrawPrize, "name" | "aliases">): string[] {
  const base = prize.name.trim();
  const terms = [base, base.replace(EDITION_SUFFIX, ""), ...prize.aliases];
  // "SystemCare" is often written "system care".
  terms.push(...terms.map(t => t.replace(/([a-z])([A-Z])/g, "$1 $2")));
  return [...new Set(terms.map(normalize).filter(t => t.trim().length >= 2))];
}

/** Prize ids a comment asks for. */
export function matchPrizes(comment: string, prizes: DrawPrize[]): string[] {
  const text = normalize(comment);
  return prizes.filter(prize => prizeMatchTerms(prize).some(term => text.includes(term))).map(prize => prize.id);
}

/** Lower-case, accent-free key for spotting the same person twice. */
export const entrantKey = (name: string) => normalize(name).trim();
