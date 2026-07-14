import type { ContactMessage } from "@/src/types/contact";

export type MessageQuickFilter = "all" | "needs_reply" | "no_email" | "replied" | "archived";

export function messageNeedsReply(message: ContactMessage): boolean {
  const hasEmail = Boolean(message.email?.trim());
  return hasEmail && (message.status === "new" || message.status === "read");
}

export function messageHasNoEmail(message: ContactMessage): boolean {
  return !message.email?.trim();
}

export function filterMessagesByQuickFilter(
  messages: ContactMessage[],
  filter: MessageQuickFilter
): ContactMessage[] {
  switch (filter) {
    case "needs_reply":
      return messages.filter(messageNeedsReply);
    case "no_email":
      return messages.filter(messageHasNoEmail);
    case "replied":
      return messages.filter(m => m.status === "replied");
    case "archived":
      return messages.filter(m => m.status === "archived");
    default:
      return messages;
  }
}

export function getMessageStats(messages: ContactMessage[]) {
  return {
    total: messages.length,
    new: messages.filter(m => m.status === "new").length,
    needsReply: messages.filter(messageNeedsReply).length,
    noEmail: messages.filter(messageHasNoEmail).length,
    replied: messages.filter(m => m.status === "replied").length,
    archived: messages.filter(m => m.status === "archived").length
  };
}

export const MESSAGE_QUICK_FILTERS: Array<{ id: MessageQuickFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "needs_reply", label: "Needs reply" },
  { id: "no_email", label: "No email" },
  { id: "replied", label: "Replied" },
  { id: "archived", label: "Archived" }
];
