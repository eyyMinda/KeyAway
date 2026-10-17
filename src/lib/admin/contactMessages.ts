import type { ContactMessage } from "@/src/types/contact";

/** "open" = not handled yet (new or read). Replied and archived leave the default view. */
export type MessageView = "open" | "needs_reply" | "no_email" | "new" | "read" | "replied" | "archived" | "all";

export function messageNeedsReply(message: ContactMessage): boolean {
  const hasEmail = Boolean(message.email?.trim());
  return hasEmail && (message.status === "new" || message.status === "read");
}

export function messageHasNoEmail(message: ContactMessage): boolean {
  return !message.email?.trim();
}

function inView(message: ContactMessage, view: MessageView): boolean {
  switch (view) {
    case "open":
      return message.status === "new" || message.status === "read";
    case "needs_reply":
      return messageNeedsReply(message);
    case "no_email":
      return messageHasNoEmail(message);
    case "all":
      return true;
    default:
      return message.status === view;
  }
}

export function filterMessagesByView(messages: ContactMessage[], view: MessageView): ContactMessage[] {
  return messages.filter(m => inView(m, view));
}

export const MESSAGE_VIEWS: Array<{ id: MessageView; label: string }> = [
  { id: "open", label: "Open" },
  { id: "needs_reply", label: "Needs reply" },
  { id: "no_email", label: "No email" },
  { id: "new", label: "New" },
  { id: "read", label: "Read" },
  { id: "replied", label: "Replied" },
  { id: "archived", label: "Archived" },
  { id: "all", label: "All" }
];

export function messageViewOptions(messages: ContactMessage[]) {
  return MESSAGE_VIEWS.map(v => ({ value: v.id, label: v.label, count: filterMessagesByView(messages, v.id).length }));
}
