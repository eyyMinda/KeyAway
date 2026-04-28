import crypto from "crypto";
import {
  getActivationEntryIdentityString,
  isLinkAccountFlow,
  normalizeProgramFlow
} from "@/src/lib/program/activationEntry";
import type { CDKey, ProgramFlow } from "@/src/types/program";

const SALT = process.env.ANALYTICS_SALT || process.env.NEXT_PUBLIC_ANALYTICS_SALT || "keyaway-default-salt";

export function normalizeKey(key: string): string {
  return key.replace(/\s+/g, "").toUpperCase();
}

/** Short digest for long link identities (URLs). Not normalized to uppercase. */
export function hashLinkActivationIdentity(identity: string): string {
  return crypto.createHash("sha256").update(identity.trim() + SALT).digest("hex").substring(0, 16);
}

function hashLinkIdentity(identity: string): { hash: string; identifier: string; normalized: string } {
  const normalized = identity.trim().toLowerCase();
  return {
    hash: hashLinkActivationIdentity(identity),
    identifier: identity.length > 200 ? `${identity.slice(0, 197)}…` : identity,
    normalized
  };
}

/**
 * Row storage id for key reports / dedupe. Return shape uses field name `hash` as the **storage key**:
 * - `cd_key` / `link_based_cdkey`: normalized plaintext key.
 * - `account`: lowercase username.
 * - `link_based_account`: short digest of URL(s) (`hashLinkActivationIdentity` / per-click URL when `activationUrl` is set).
 */
export function getKeyData(
  key?: unknown,
  programFlow?: unknown,
  activationUrl?: unknown
): { hash: string; identifier: string; normalized: string } | undefined {
  const flow = normalizeProgramFlow(programFlow);
  const url = typeof activationUrl === "string" && activationUrl.trim() ? activationUrl.trim().toLowerCase() : "";

  if (typeof key === "string" && key.trim()) {
    if (isLinkAccountFlow(flow) && url) {
      return hashLinkIdentity(url);
    }
    if (isLinkAccountFlow(flow)) {
      return hashLinkIdentity(key.trim());
    }
    const plain = normalizeKey(key.trim());
    return { hash: plain, identifier: plain, normalized: plain };
  }

  if (key && typeof key === "object") {
    const row = key as CDKey & { programFlow?: string };
    const flowFromPayload = row.programFlow != null ? normalizeProgramFlow(row.programFlow) : flow;

    if (isLinkAccountFlow(flowFromPayload) && url) {
      return hashLinkIdentity(url);
    }

    const identity = getActivationEntryIdentityString(row, flowFromPayload);
    if (identity) {
      if (isLinkAccountFlow(flowFromPayload)) {
        return hashLinkIdentity(identity);
      }
      if (flowFromPayload === "account") {
        const u = (row.username ?? "").trim().toLowerCase();
        if (!u) return undefined;
        return { hash: u, identifier: u, normalized: u };
      }
      const plain = normalizeKey(identity);
      return { hash: plain, identifier: plain, normalized: plain };
    }

    const fallbackKey = typeof row.key === "string" ? row.key.trim() : "";
    if (fallbackKey) {
      const plain = normalizeKey(fallbackKey);
      return { hash: plain, identifier: plain, normalized: plain };
    }
  }

  return undefined;
}

/** Client/server row storage key (matches `getKeyData(...).hash` and keyReport `key`; CD/account = plaintext, links = digest). */
export function getRowStorageHash(cdKey: CDKey, flow: ProgramFlow): string {
  const kd = getKeyData({ ...cdKey, programFlow: flow }, flow);
  return kd?.hash ?? "";
}
