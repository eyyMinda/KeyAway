import type { PortableTextBlock } from "@portabletext/types";
import { portableTextToPlainText } from "@/src/lib/portableText/toPlainText";

export const MAX_COMMENT_AUTHOR = 80;
export const MAX_COMMENT_BODY = 2000;

/** Normalize visitor or CMS comment body (plain text or legacy portable text). */
export function commentBodyToPlain(body: string | PortableTextBlock[] | undefined | null): string {
  if (typeof body === "string") return body.trim();
  if (Array.isArray(body)) return portableTextToPlainText(body).trim();
  return "";
}

export function hasCommentBody(body: string | PortableTextBlock[] | undefined | null): boolean {
  return commentBodyToPlain(body).length > 0;
}

export function sanitizeCommentBody(raw: string): string {
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, MAX_COMMENT_BODY);
}

export function sanitizeCommentAuthor(raw: string): string {
  return raw.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, MAX_COMMENT_AUTHOR);
}
