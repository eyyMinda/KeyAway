import { Filter } from "bad-words";

const profanityFilter = new Filter();

const MAX_URLS = 4;
const URL_PATTERN = /https?:\/\/|www\./gi;

export type CommentModerationResult =
  | { ok: true }
  | { ok: false; message: string; field?: string };

export function moderateCommentInput(opts: {
  authorName: string;
  body: string;
  honeypot?: string;
}): CommentModerationResult {
  const { authorName, body, honeypot } = opts;

  if (honeypot?.trim()) {
    return { ok: false, message: "Unable to post comment." };
  }

  if (profanityFilter.isProfane(authorName)) {
    return { ok: false, message: "Display name contains language that is not allowed.", field: "authorName" };
  }

  if (profanityFilter.isProfane(body)) {
    return { ok: false, message: "Comment contains language that is not allowed.", field: "body" };
  }

  const urlMatches = body.match(URL_PATTERN);
  if (urlMatches && urlMatches.length > MAX_URLS) {
    return { ok: false, message: "Too many links in one comment.", field: "body" };
  }

  if (/(.)\1{12,}/.test(body)) {
    return { ok: false, message: "Comment looks like spam.", field: "body" };
  }

  return { ok: true };
}
