/** Validators for `schemaTypes/program/*` (program, cdKey, aboutSection, faqItem, etc.). */

import { portableTextHasContent } from "@/src/lib/portableText/toPlainText";
import type { CDKeyStatus } from "@/src/types/program";

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

/** `program.cdKeys` — each row has key + status; no duplicate keys in-program. */
export function validateProgramCdKeysArray(keys: unknown): true | string {
  if (!Array.isArray(keys) || keys.length === 0) return true;
  const allowed = new Set(["new", "active", "expired", "limit"]);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i] as { key?: string; status?: string } | undefined;
    const label = `Key #${i + 1}`;
    if (typeof k?.key !== "string" || !k.key.trim()) {
      return `${label}: key text is required.`;
    }
    if (typeof k?.status !== "string" || !k.status.trim()) {
      return `${label}: status is required (New / Active / Expired / Limit).`;
    }
    if (!allowed.has(k.status.trim().toLowerCase())) {
      return `${label}: status must be one of new, active, expired, limit.`;
    }
  }
  const normalized = keys
    .map(item => {
      const row = item as { key?: string };
      return typeof row?.key === "string" ? row.key.trim().toUpperCase().replace(/\s+/g, "") : "";
    })
    .filter(Boolean);
  const unique = new Set(normalized);
  if (unique.size < normalized.length) {
    return "Duplicate CD keys are not allowed within the same program.";
  }
  return true;
}
