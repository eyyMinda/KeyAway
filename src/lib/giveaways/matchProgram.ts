import { normalizeProgramFlow } from "@/src/lib/program/activationEntry";
import type { GiveawayMatchMethod, GiveawayWatchPage } from "@/src/types/giveaways";
import type { ProgramFlow } from "@/src/types/program";

/** Program fields loaded once per discovery run (see `discoveryProgramsQuery`). */
export interface DiscoveryProgram {
  _id: string;
  title: string;
  slug?: string;
  programFlow?: string;
  vendor?: { name?: string; aliases?: string[] | null } | null;
  giveawayDiscovery?: { aliases?: string[] | null; ignore?: boolean } | null;
  cdKeys?: Array<{ key?: string; username?: string; giveawayLinks?: Array<{ url?: string }> | null }> | null;
}

export interface IndexedProgram {
  program: DiscoveryProgram;
  flow: ProgramFlow;
  compact: string;
  /** False when stripping the vendor name would leave nothing (e.g. vendor "WinRAR", program "WinRAR"). */
  stripVendors: boolean;
  /** Number of words in `compact`, used to size fuzzy match windows. */
  tokenCount: number;
  /** Aliases with vendor names stripped; `words` is the remaining word count. */
  aliasCompacts: { compact: string; words: number }[];
  vendorTerms: string[];
}

export type MatchResult =
  | { kind: "matched"; program: IndexedProgram; method: Exclude<GiveawayMatchMethod, "possible" | "manual">; confidence: number }
  | { kind: "possible"; candidates: { program: IndexedProgram; score: number }[] };

const MATCH_THRESHOLD = 0.85;
/** Below this a title is ignored. Kept high so generic words ("security", "recovery") don't create noise. */
const POSSIBLE_THRESHOLD = 0.75;
/** Title contains the (multi-word) program name plus extra words, but no vendor name to confirm it. */
const UNCONFIRMED_CONTAINMENT_SCORE = 0.75;
/** A word window must be nearly the same spelling as the program name to count without the vendor name. */
const PARTIAL_MIN_SIMILARITY = 0.85;
const VENDOR_BOOST = 0.1;
/** Highest score a partial-title fuzzy hit can reach without the vendor name (stays a possible match). */
const PARTIAL_CAP = 0.75;

const MIN_COMPACT = 3;

const NOISE_WORDS = new Set([
  "giveaway",
  "free",
  "freebie",
  "license",
  "licence",
  "licenses",
  "key",
  "keys",
  "code",
  "codes",
  "serial",
  "pro",
  "professional",
  "premium",
  "plus",
  "full",
  "version",
  "lifetime",
  "edition",
  "get",
  "download",
  "discount",
  "off",
  "deal",
  "subscription",
  "plan",
  "for",
  "pc",
  "the",
  "and",
  "with",
  "v"
]);

const NOISE_PHRASES: RegExp[] = [
  /\b\d+\s*%\s*(?:off|discount)\b/g,
  /\bfor\s+(?:windows|win|mac|macos|pc|android|ios|iphone)\b/g,
  /\b\d+[\s-]*(?:years?|yrs?|months?|days?|pcs?|devices?|users?)\b/g
];

/** Lowercase, drop brackets/discounts/versions/punctuation. Keeps word boundaries as single spaces. */
export function normalizeText(input: string): string {
  let s = ` ${input.toLowerCase()} `;
  s = s.replace(/\([^)]*\)|\[[^\]]*\]/g, " ");
  for (const re of NOISE_PHRASES) s = s.replace(re, " ");
  s = s.replace(/\bv?\d+(?:\.\d+)+[a-z]?\b/g, " ");
  s = s.replace(/[^a-z0-9]+/g, " ");
  return ` ${s.trim().replace(/\s+/g, " ")} `;
}

function removeTerms(normalized: string, terms: string[]): string {
  let s = normalized;
  for (const term of terms) {
    const needle = ` ${term} `;
    while (s.includes(needle)) s = s.replace(needle, " ");
  }
  return s;
}

function tokensOf(normalized: string): string[] {
  return normalized
    .trim()
    .split(" ")
    .filter(t => t && !NOISE_WORDS.has(t) && !/^\d+$/.test(t));
}

/** Readable cleaned name, e.g. "AOMEI Ultra Pic Pro 2.1 Giveaway" → "ultra pic" (with vendors stripped). */
export function cleanName(input: string, vendorTerms: string[] = []): string {
  return tokensOf(removeTerms(normalizeText(input), vendorTerms)).join(" ");
}

export function compactName(input: string, vendorTerms: string[] = []): string {
  return cleanName(input, vendorTerms).replace(/\s+/g, "");
}

function bigrams(s: string): Map<string, number> {
  const m = new Map<string, number>();
  for (let i = 0; i < s.length - 1; i++) {
    const g = s.slice(i, i + 2);
    m.set(g, (m.get(g) ?? 0) + 1);
  }
  return m;
}

/** Sørensen–Dice similarity on character bigrams (0–1). */
export function dice(a: string, b: string): number {
  if (a === b) return a.length ? 1 : 0;
  if (a.length < 2 || b.length < 2) return 0;
  const ga = bigrams(a);
  const gb = bigrams(b);
  let overlap = 0;
  for (const [g, n] of ga) overlap += Math.min(n, gb.get(g) ?? 0);
  return (2 * overlap) / (a.length - 1 + (b.length - 1));
}

/** Host + path without www, trailing slash, hash, or utm_* params. Used for watch URLs and find ids. */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    const params = [...u.searchParams.entries()].filter(([k]) => !k.toLowerCase().startsWith("utm_"));
    const query = params.length ? `?${new URLSearchParams(params).toString()}` : "";
    const path = u.pathname.replace(/\/+$/, "");
    return `${u.hostname.toLowerCase().replace(/^www\./, "")}${path}${query}`;
  } catch {
    return url.trim().toLowerCase().replace(/\/+$/, "");
  }
}

/** Normalized vendor names/aliases, longest first, for stripping from titles. */
export function termList(values: Array<string | undefined | null>): string[] {
  const out = new Set<string>();
  for (const v of values) {
    if (!v) continue;
    const term = normalizeText(v).trim();
    if (term.replace(/\s/g, "").length >= MIN_COMPACT) out.add(term);
  }
  // Longest first so "aomei tech" is removed before "aomei".
  return [...out].sort((a, b) => b.length - a.length);
}

type Hit = { method: "alias" | "title" | "fuzzy"; confidence: number; length: number };

/**
 * Name hits (alias/title) beat fuzzy ones; among name hits the longest matched name wins, so
 * "Advanced SystemCare Ultimate 18" picks the Ultimate program over an "Advanced SystemCare" alias.
 */
function isBetter(a: Hit, b: Hit): boolean {
  const aName = a.method !== "fuzzy";
  const bName = b.method !== "fuzzy";
  if (aName !== bName) return aName;
  if (aName && a.length !== b.length) return a.length > b.length;
  return a.confidence > b.confidence || (a.confidence === b.confidence && a.length > b.length);
}

export function createProgramMatcher(programs: DiscoveryProgram[], watchPages: GiveawayWatchPage[] = []) {
  const allVendorTerms = termList(programs.flatMap(p => [p.vendor?.name, ...(p.vendor?.aliases ?? [])]));

  const indexed: IndexedProgram[] = programs
    .filter(p => p.title && !p.giveawayDiscovery?.ignore)
    .map(p => {
      const vendorTerms = termList([p.vendor?.name, ...(p.vendor?.aliases ?? [])]);
      const stripped = cleanName(p.title, allVendorTerms);
      const stripVendors = stripped.replace(/\s/g, "").length >= MIN_COMPACT;
      const terms = stripVendors ? allVendorTerms : [];
      const clean = stripVendors ? stripped : cleanName(p.title);
      return {
        program: p,
        flow: normalizeProgramFlow(p.programFlow),
        compact: clean.replace(/\s/g, ""),
        stripVendors,
        tokenCount: Math.max(1, clean.split(" ").filter(Boolean).length),
        aliasCompacts: (p.giveawayDiscovery?.aliases ?? [])
          .map(a => cleanName(a, terms))
          .map(clean => ({ compact: clean.replace(/\s/g, ""), words: clean.split(" ").filter(Boolean).length }))
          .filter(a => a.compact.length >= MIN_COMPACT),
        vendorTerms
      };
    });

  const byId = new Map(indexed.map(ip => [ip.program._id, ip]));

  const byWatchUrl = new Map<string, IndexedProgram>();
  for (const page of watchPages) {
    const ip = byId.get(page.programId);
    if (ip) byWatchUrl.set(normalizeUrl(page.url), ip);
  }

  function matchWatchUrl(url: string): IndexedProgram | undefined {
    return byWatchUrl.get(normalizeUrl(url));
  }

  function matchTitle(title: string): MatchResult | null {
    const normalized = normalizeText(title);
    const strippedTokens = tokensOf(removeTerms(normalized, allVendorTerms));
    const rawTokens = tokensOf(normalized);

    let best: { program: IndexedProgram; method: "alias" | "title" | "fuzzy"; confidence: number; length: number } | null =
      null;
    const scored: { program: IndexedProgram; score: number }[] = [];

    for (const ip of indexed) {
      const tokens = ip.stripVendors ? strippedTokens : rawTokens;
      const compact = tokens.join("");
      if (!compact) continue;
      const vendorInTitle = ip.vendorTerms.some(t => normalized.includes(` ${t} `));

      let confidence = 0;
      let method: "alias" | "title" | "fuzzy" = "fuzzy";
      let length = 0;

      // Same rule as program names: a one-word alias ("Avast One" → "one") inside a longer title needs
      // the vendor name, otherwise "Donemax" would match "one".
      const alias = ip.aliasCompacts
        .filter(a => compact.includes(a.compact) && (compact === a.compact || a.words >= 2 || vendorInTitle))
        .sort((a, b) => b.compact.length - a.compact.length)[0];
      if (alias) {
        confidence = 0.95;
        method = "alias";
        length = alias.compact.length;
      } else if (compact === ip.compact) {
        confidence = 0.9;
        method = "title";
        length = ip.compact.length;
      } else if (ip.compact.length >= 5 && compact.includes(ip.compact) && vendorInTitle) {
        confidence = 0.9;
        method = "title";
        length = ip.compact.length;
      } else if (ip.compact.length >= 5 && compact.startsWith(ip.compact)) {
        // Without the vendor name, the program name must open the title ("MacBooster 8 PRO – One-stop…",
        // "Smart Game Booster VIP Giveaway") and it stays a possible match. Generic names elsewhere in a
        // title ("Magoshare Data Recovery", "Revo Uninstaller") are someone else's product.
        confidence = UNCONFIRMED_CONTAINMENT_SCORE;
        method = "title";
        length = ip.compact.length;
      }

      // A one-word program name ("Uninstaller", "Security") is too generic to match inside a longer
      // title without the vendor name: "Revo Uninstaller" is not "IObit Uninstaller".
      const genericWord = !vendorInTitle && ip.tokenCount < 2 && compact !== ip.compact;
      // The program name appears later in the title without the vendor: another product with the same words.
      const elsewhere = !vendorInTitle && compact.includes(ip.compact) && !compact.startsWith(ip.compact);

      // Fuzzy only when there is no alias/title hit. Similarity to the whole title can match outright;
      // similarity to just part of it (a word window) needs the vendor name or a multi-word program name.
      if (confidence === 0 && !genericWord && !elsewhere) {
        const whole = dice(compact, ip.compact) + (vendorInTitle ? VENDOR_BOOST : 0);
        let partial = 0;
        for (let size = Math.max(1, ip.tokenCount - 1); size <= ip.tokenCount + 1; size++) {
          // Without the vendor name only the title's opening words are compared (see above).
          const lastStart = vendorInTitle ? tokens.length - size : 0;
          for (let i = 0; i <= lastStart && i + size <= tokens.length; i++) {
            partial = Math.max(partial, dice(tokens.slice(i, i + size).join(""), ip.compact));
          }
        }
        if (!vendorInTitle) partial = partial >= PARTIAL_MIN_SIMILARITY ? Math.min(partial, PARTIAL_CAP) : 0;
        confidence = Math.min(0.99, Math.max(whole, partial));
        method = "fuzzy";
        length = ip.compact.length;
      }

      if (confidence >= POSSIBLE_THRESHOLD) scored.push({ program: ip, score: Number(confidence.toFixed(3)) });

      const isMatch = method === "fuzzy" ? confidence >= MATCH_THRESHOLD : confidence >= 0.9;
      if (isMatch && (!best || isBetter({ method, confidence, length }, best))) {
        best = { program: ip, method, confidence, length };
      }
    }

    if (best) {
      return {
        kind: "matched",
        program: best.program,
        method: best.method,
        confidence: Number(best.confidence.toFixed(3))
      };
    }
    if (scored.length) {
      scored.sort((a, b) => b.score - a.score);
      return { kind: "possible", candidates: scored.slice(0, 3) };
    }
    return null;
  }

  return { matchTitle, matchWatchUrl, byId, byWatchUrl, allVendorTerms };
}

export type ProgramMatcher = ReturnType<typeof createProgramMatcher>;
