/** @fileoverview Reply email wording for key suggestions (client-safe: used by the admin modal and the sender). */
import type { KeySuggestion } from "@/src/types/contact";

export const KEY_SUGGESTION_OPENING = "Thanks for suggesting a key on KeyAway!";

/** Subject, greeting and the quoted suggestion; the store adds links and branding. */
export function keySuggestionReplyContent(
  suggestion: Pick<KeySuggestion, "programName" | "programVersion" | "programLink" | "cdKey" | "message" | "name">
) {
  const version = suggestion.programVersion?.trim();
  const lines = [
    `Program: ${suggestion.programName}${version ? ` (v${version})` : ""}`,
    `Key: ${suggestion.cdKey}`,
    suggestion.programLink ? `Link: ${suggestion.programLink}` : null,
    suggestion.message?.trim() ? `\n${suggestion.message.trim()}` : null
  ].filter(Boolean);

  return {
    subject: `Key suggestion: ${suggestion.programName}`,
    originalMessage: lines.join("\n"),
    recipientName: suggestion.name,
    openingLine: KEY_SUGGESTION_OPENING
  };
}
