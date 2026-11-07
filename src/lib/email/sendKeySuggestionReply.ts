import { client } from "@/src/sanity/lib/client";
import { keySuggestionReplyContent } from "@/src/lib/email/keySuggestionReply";
import { ReplySendError, deliverAdminReply, fetchStoreForReply } from "@/src/lib/email/sendContactMessageReply";
import type { ContactMessageReply, KeySuggestion } from "@/src/types/contact";

const SUGGESTION_FOR_REPLY_QUERY = `*[_type == "keySuggestion" && _id == $id][0]{
  _id, cdKey, programName, programVersion, programLink, name, email, message
}`;

/** Emails the visitor who suggested a key and records the reply on the suggestion. Status is left to the admin. */
export async function sendKeySuggestionReply(opts: {
  suggestionId: string;
  replyText: string;
  adminEmail: string;
}): Promise<{ reply: ContactMessageReply; suggestion: KeySuggestion }> {
  const [suggestion, store] = await Promise.all([
    client.fetch<KeySuggestion | null>(SUGGESTION_FOR_REPLY_QUERY, { id: opts.suggestionId }),
    fetchStoreForReply()
  ]);

  if (!suggestion?._id) {
    throw new ReplySendError("Suggestion not found.", "NOT_FOUND");
  }

  const reply = await deliverAdminReply({
    to: suggestion.email,
    content: keySuggestionReplyContent(suggestion),
    store,
    replyText: opts.replyText,
    adminEmail: opts.adminEmail
  });

  const updated = await client
    .patch(suggestion._id)
    .set({ lastRepliedAt: reply.sentAt })
    .setIfMissing({ replies: [] })
    .append("replies", [{ ...reply, _type: "contactMessageReply" }])
    .commit({ returnDocuments: true });

  return { reply, suggestion: updated as unknown as KeySuggestion };
}
