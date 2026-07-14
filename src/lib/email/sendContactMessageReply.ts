import { client } from "@/src/sanity/lib/client";
import { buildAdminReplyTemplate, type AdminReplyMailtoOptions } from "@/src/lib/email/adminReplyMailto";
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

export const MAX_REPLY_BODY_LENGTH = 10000;

type StoreForReply = {
  title?: string;
  supportEmail?: string;
  seo?: { siteUrl?: string };
  socialLinks?: Array<{ platform: string; url: string }>;
  otherLinks?: Array<{ kind: string; url?: string }>;
};

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
  message: Pick<ContactMessage, "title" | "message" | "name">,
  store: StoreForReply | null | undefined,
  adminReply: string
): Omit<AdminReplyMailtoOptions, "to"> {
  return {
    subject: message.title ?? "",
    originalMessage: message.message,
    recipientName: message.name,
    adminReply,
    siteBaseUrl: resolveSiteBaseUrl(store?.seo),
    storeTitle: store?.title,
    footerLinks: resolveEmailFooterLinks(store)
  };
}

export async function sendContactMessageReply(opts: {
  messageId: string;
  replyText: string;
  adminEmail: string;
}): Promise<{ reply: ContactMessageReply; message: ContactMessage }> {
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

  const [message, store] = await Promise.all([
    client.fetch<ContactMessage | null>(MESSAGE_FOR_REPLY_QUERY, { id: opts.messageId }),
    client.fetch<StoreForReply | null>(STORE_FOR_REPLY_QUERY)
  ]);

  if (!message?._id) {
    throw new ReplySendError("Message not found.", "NOT_FOUND");
  }

  const to = message.email?.trim();
  if (!to) {
    throw new ReplySendError("This message has no email address. Add one before sending a reply.", "NO_EMAIL");
  }

  const templateOptions = buildReplyTemplateOptions(message, store, replyBody);
  const template = buildAdminReplyTemplate(templateOptions);
  const from = getResendFromAddress()!;
  const replyTo = getResendReplyToAddress(resolveSupportEmail(store));

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
    console.error("[sendContactMessageReply] Resend error:", error);
    throw new ReplySendError(error.message || "Failed to send email.", "SEND_FAILED");
  }

  const sentAt = new Date().toISOString();
  const replyKey = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const replyRecord: ContactMessageReply = {
    _key: replyKey,
    body: replyBody,
    subject: template.subject,
    sentTo: to,
    sentBy: opts.adminEmail,
    sentAt,
    ...(data?.id ? { resendId: data.id } : {})
  };

  const updated = await client
    .patch(message._id)
    .set({ status: "replied", lastRepliedAt: sentAt })
    .setIfMissing({ replies: [] })
    .append("replies", [{ ...replyRecord, _type: "contactMessageReply" }])
    .commit({ returnDocuments: true });

  return {
    reply: replyRecord,
    message: updated as unknown as ContactMessage
  };
}
