import { client } from "@/src/sanity/lib/client";
import {
  MAX_REPLY_BODY_LENGTH,
  buildAdminReplyTemplate,
  type AdminReplyMailtoOptions
} from "@/src/lib/email/adminReplyMailto";
import {
  getResendClient,
  getResendFromAddress,
  getResendReplyToAddress,
  isResendConfigured
} from "@/src/lib/email/resendClient";
import { resolveSiteBaseUrl } from "@/src/lib/seo/storeSeoResolve";
import { resolveSupportEmail } from "@/src/lib/site/supportEmail";
import { resolveEmailFooterLinks } from "@/src/lib/email/resolveEmailFooterLinks";
import type { ContactMessage, ContactMessageReply } from "@/src/types/contact";

const STORE_FOR_REPLY_QUERY = `*[_type=="storeDetails"][0]{
  title,
  supportEmail,
  seo{ siteUrl },
  socialLinks[]{ platform, url },
  otherLinks[]{ kind, url }
}`;

const MESSAGE_FOR_REPLY_QUERY = `*[_type == "contactMessage" && _id == $id][0]{
  _id,
  title,
  message,
  name,
  email,
  status
}`;

export { MAX_REPLY_BODY_LENGTH };

export type StoreForReply = {
  title?: string;
  supportEmail?: string;
  seo?: { siteUrl?: string };
  socialLinks?: Array<{ platform: string; url: string }>;
  otherLinks?: Array<{ kind: string; url?: string }>;
};

/** What a reply needs besides the store's links and branding. */
export type ReplyContent = Pick<
  AdminReplyMailtoOptions,
  "subject" | "originalMessage" | "recipientName" | "openingLine"
>;

export class ReplySendError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_CONFIGURED" | "NOT_FOUND" | "NO_EMAIL" | "SEND_FAILED"
  ) {
    super(message);
    this.name = "ReplySendError";
  }
}

export function buildReplyTemplateOptions(
  content: ReplyContent,
  store: StoreForReply | null | undefined,
  adminReply: string
): Omit<AdminReplyMailtoOptions, "to"> {
  return {
    ...content,
    adminReply,
    siteBaseUrl: resolveSiteBaseUrl(store?.seo),
    storeTitle: store?.title,
    footerLinks: resolveEmailFooterLinks(store)
  };
}

export function fetchStoreForReply(): Promise<StoreForReply | null> {
  return client.fetch<StoreForReply | null>(STORE_FOR_REPLY_QUERY);
}

/** Sends one admin reply through Resend and returns the record to append to the document's `replies`. */
export async function deliverAdminReply(opts: {
  to: string | undefined;
  content: ReplyContent;
  store: StoreForReply | null;
  replyText: string;
  adminEmail: string;
}): Promise<ContactMessageReply> {
  if (!isResendConfigured()) {
    throw new ReplySendError(
      "Email sending is not configured. Set RESEND_API_KEY and RESEND_FROM in your environment.",
      "NOT_CONFIGURED"
    );
  }

  const replyBody = opts.replyText.trim();
  if (!replyBody) {
    throw new ReplySendError("Reply text is required.", "SEND_FAILED");
  }
  if (replyBody.length > MAX_REPLY_BODY_LENGTH) {
    throw new ReplySendError(`Reply too long (max ${MAX_REPLY_BODY_LENGTH} characters).`, "SEND_FAILED");
  }

  const to = opts.to?.trim();
  if (!to) {
    throw new ReplySendError("No email address on file. Add one before sending a reply.", "NO_EMAIL");
  }

  const template = buildAdminReplyTemplate(buildReplyTemplateOptions(opts.content, opts.store, replyBody));
  const from = getResendFromAddress()!;
  const replyTo = getResendReplyToAddress(resolveSupportEmail(opts.store));

  const resend = getResendClient()!;
  const { data, error } = await resend.emails.send({
    from,
    to,
    ...(replyTo ? { replyTo } : {}),
    subject: template.subject,
    html: template.htmlBody,
    text: template.plainTextBody
  });

  if (error) {
    console.error("[deliverAdminReply] Resend error:", error);
    throw new ReplySendError(error.message || "Failed to send email.", "SEND_FAILED");
  }

  return {
    _key: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
    body: replyBody,
    subject: template.subject,
    sentTo: to,
    sentBy: opts.adminEmail,
    sentAt: new Date().toISOString(),
    ...(data?.id ? { resendId: data.id } : {})
  };
}

export async function sendContactMessageReply(opts: {
  messageId: string;
  replyText: string;
  adminEmail: string;
}): Promise<{ reply: ContactMessageReply; message: ContactMessage }> {
  const [message, store] = await Promise.all([
    client.fetch<ContactMessage | null>(MESSAGE_FOR_REPLY_QUERY, { id: opts.messageId }),
    fetchStoreForReply()
  ]);

  if (!message?._id) {
    throw new ReplySendError("Message not found.", "NOT_FOUND");
  }

  const reply = await deliverAdminReply({
    to: message.email,
    content: { subject: message.title ?? "", originalMessage: message.message, recipientName: message.name },
    store,
    replyText: opts.replyText,
    adminEmail: opts.adminEmail
  });

  const updated = await client
    .patch(message._id)
    .set({ status: "replied", lastRepliedAt: reply.sentAt })
    .setIfMissing({ replies: [] })
    .append("replies", [{ ...reply, _type: "contactMessageReply" }])
    .commit({ returnDocuments: true });

  return {
    reply,
    message: updated as unknown as ContactMessage
  };
}
