import { toPlainText } from "@portabletext/toolkit";
import type { PortableTextBlock } from "@portabletext/types";

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Portable Text array / single block / plain string → plain string. */
export function portableTextToPlainText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return normalizeWhitespace(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    try {
      return normalizeWhitespace(toPlainText(value as PortableTextBlock[]));
    } catch {
      return "";
    }
  }
  if (typeof value === "object" && "_type" in (value as object)) {
    try {
      return normalizeWhitespace(toPlainText(value as PortableTextBlock));
    } catch {
      return "";
    }
  }
  return "";
}

export function portableTextHasContent(value: unknown): boolean {
  return portableTextToPlainText(value).length > 0;
}

export function portableTextExcerpt(value: unknown, maxLen: number): string {
  const t = portableTextToPlainText(value);
  if (t.length <= maxLen) return t;
  const slice = t.slice(0, maxLen - 1).trimEnd();
  return slice ? `${slice}…` : "…";
}
