/** Validators for `schemaTypes/program/*` (program, cdKey, aboutSection, faqItem, etc.). */

import { portableTextHasContent } from "@/src/lib/portableText/toPlainText";
import { getActivationEntryIdentityString, isAccountFlow, isKeyLikeFlow, isLinkAccountFlow } from "@/src/lib/program/activationEntry";
import type { CDKeyStatus, ProgramFlow } from "@/src/types/program";

/** Block arrays: require at least one meaningful block. */
export function validatePortableTextRequired(value: unknown, emptyMessage: string): true | string {
  return portableTextHasContent(value) ? true : emptyMessage;
}

const CD_KEY_STATUSES: readonly CDKeyStatus[] = ["new", "active", "expired", "limit"];

/** `cdKey.status` — must be one of the known radio values. */
export function validateCdKeyStatusValue(value: unknown): true | string {
  if (typeof value !== "string") return "Status is required";
  if (!CD_KEY_STATUSES.includes(value as CDKeyStatus)) return "Pick a valid status";
  return true;
}

/** `cdKey.validUntil` — optional; reject unparseable datetime strings. */
export function validateOptionalValidUntilDatetime(value: unknown): true | string {
  if (value == null || value === "") return true;
  if (typeof value === "string" && Number.isNaN(new Date(value).getTime())) {
    return "Invalid date format";
  }
  return true;
}

/** `program.faq` — 0 or 2+ items; exactly one is invalid for FAQ rich results. */
export function validateFaqNotExactlyOne(items: unknown): true | string {
  const n = Array.isArray(items) ? items.length : 0;
  if (n === 1) {
    return "Add a second FAQ entry or remove FAQ items entirely (FAQ rich results need at least 2 questions).";
  }
  return true;
}

type ActivationRow = {
  key?: string;
  status?: string;
  username?: string;
  password?: string;
  accountLabel?: string;
  giveawayLinks?: Array<{ title?: string; url?: string }>;
};

/** `program.cdKeys` — rows validated by `program.programFlow`; duplicates by stable identity. */
export function validateProgramActivationEntries(keys: unknown, programFlow: unknown): true | string {
  if (!Array.isArray(keys) || keys.length === 0) return true;
  const flow = (typeof programFlow === "string" ? programFlow : "cd_key") as ProgramFlow;
  const allowed = new Set(["new", "active", "expired", "limit"]);

  for (let i = 0; i < keys.length; i++) {
    const k = keys[i] as ActivationRow | undefined;
    const label = `Row #${i + 1}`;

    if (typeof k?.status !== "string" || !k.status.trim()) {
      return `${label}: status is required (New / Active / Expired / Limit).`;
    }
    if (!allowed.has(k.status.trim().toLowerCase())) {
      return `${label}: status must be one of new, active, expired, limit.`;
    }

    if (isKeyLikeFlow(flow)) {
      if (typeof k?.key !== "string" || !k.key.trim()) {
        return `${label}: key text is required for this activation flow.`;
      }
    } else if (isAccountFlow(flow)) {
      if (typeof k?.username !== "string" || !k.username.trim()) {
        return `${label}: username is required for account-based activation.`;
      }
      if (typeof k?.password !== "string" || !k.password.trim()) {
        return `${label}: password is required for account-based activation.`;
      }
    } else if (isLinkAccountFlow(flow)) {
      const links = Array.isArray(k?.giveawayLinks) ? k.giveawayLinks : [];
      if (links.length === 0) {
        return `${label}: add at least one giveaway link (title + URL).`;
      }
      for (let j = 0; j < links.length; j++) {
        const link = links[j];
        if (!link?.url || typeof link.url !== "string" || !String(link.url).trim()) {
          return `${label}: link #${j + 1} must have a URL.`;
        }
      }
    }
  }

  const identities = keys
    .map(item => getActivationEntryIdentityString(item as never, flow))
    .filter(Boolean);
  const unique = new Set(identities);
  if (unique.size < identities.length) {
    return "Duplicate activation rows are not allowed within the same program.";
  }
  return true;
}

/** @deprecated use validateProgramActivationEntries with programFlow */
export function validateProgramCdKeysArray(keys: unknown): true | string {
  return validateProgramActivationEntries(keys, "cd_key");
}
