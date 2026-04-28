/**
 * @fileoverview Program activation flows: identity strings for reporting/hashing,
 * display labels, clipboard payloads, and flow normalization (defaults for legacy CMS docs).
 */
import type { CDKey, GiveawayLink, ProgramFlow } from "@/src/types/program";

const FLOWS: readonly ProgramFlow[] = ["cd_key", "link_based_cdkey", "account", "link_based_account"];

export function normalizeProgramFlow(value: unknown): ProgramFlow {
  if (typeof value === "string" && (FLOWS as readonly string[]).includes(value)) {
    return value as ProgramFlow;
  }
  return "cd_key";
}

export function isKeyLikeFlow(flow: ProgramFlow): boolean {
  return flow === "cd_key" || flow === "link_based_cdkey";
}

export function isAccountFlow(flow: ProgramFlow): boolean {
  return flow === "account";
}

export function isLinkAccountFlow(flow: ProgramFlow): boolean {
  return flow === "link_based_account";
}

/** Stable string used for hashing, report map keys, and dedupe (must match server `getKeyData`). */
export function getActivationEntryIdentityString(cdKey: CDKey, flow: ProgramFlow): string {
  if (isKeyLikeFlow(flow)) {
    const k = (cdKey.key ?? "").trim();
    return k ? k.replace(/\s+/g, "").toUpperCase() : "";
  }
  if (isAccountFlow(flow)) {
    const u = (cdKey.username ?? "").trim().toLowerCase();
    return u ? `account:${u}` : "";
  }
  if (isLinkAccountFlow(flow)) {
    const links = cdKey.giveawayLinks ?? [];
    const parts = links
      .map((l: GiveawayLink) => (typeof l?.url === "string" ? l.url.trim().toLowerCase() : ""))
      .filter(Boolean)
      .sort();
    return parts.length ? `links:${parts.join("|")}` : "";
  }
  return "";
}

export function getActivationEntryDisplayLabel(cdKey: CDKey, flow: ProgramFlow): string {
  if (isKeyLikeFlow(flow)) return (cdKey.key ?? "").trim() || "—";
  if (isAccountFlow(flow)) {
    const label = (cdKey.accountLabel ?? "").trim();
    const u = (cdKey.username ?? "").trim();
    return label || u || "—";
  }
  if (isLinkAccountFlow(flow)) {
    const titles = (cdKey.giveawayLinks ?? [])
      .map((l: GiveawayLink) => (typeof l?.title === "string" ? l.title.trim() : ""))
      .filter(Boolean);
    return titles.length ? titles.join(", ") : "—";
  }
  return "—";
}

/** Text placed on clipboard for the primary copy action. */
export function getActivationCopyText(cdKey: CDKey, flow: ProgramFlow): string | null {
  if (isKeyLikeFlow(flow)) {
    const k = (cdKey.key ?? "").trim();
    return k || null;
  }
  if (isAccountFlow(flow)) {
    const u = (cdKey.username ?? "").trim();
    const p = (cdKey.password ?? "").trim();
    if (!u && !p) return null;
    if (u && p) return `${u}\n${p}`;
    return u || p || null;
  }
  if (isLinkAccountFlow(flow)) {
    const lines = (cdKey.giveawayLinks ?? [])
      .map((l: GiveawayLink) => {
        const t = (l?.title ?? "").trim();
        const url = (l?.url ?? "").trim();
        if (!url) return "";
        return t ? `${t}\n${url}` : url;
      })
      .filter(Boolean);
    return lines.length ? lines.join("\n\n") : null;
  }
  return null;
}
