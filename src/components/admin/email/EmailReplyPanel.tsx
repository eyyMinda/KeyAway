"use client";

/**
 * @fileoverview Admin email reply: compose an HTML reply sent through Resend (or open it in the mail app), and the
 * history of replies already sent. Shared by contact messages and key suggestions.
 */
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FaEnvelope, FaPaperPlane } from "react-icons/fa";
import { useStoreDetails } from "@/src/components/providers/StoreDetailsProvider";
import Toast from "@/src/components/ui/Toast";
import { MAX_REPLY_BODY_LENGTH, type AdminReplyMailtoOptions } from "@/src/lib/email/adminReplyMailto";
import { openAdminReplyEmail } from "@/src/lib/email/openAdminReplyEmail";
import { resolveEmailFooterLinks } from "@/src/lib/email/resolveEmailFooterLinks";
import { NOTIFICATION_DURATION } from "@/src/lib/notifications/notificationUtils";
import { resolveSiteBaseUrl } from "@/src/lib/seo/storeSeoResolve";
import type { ContactMessageReply } from "@/src/types/contact";

export type EmailReplyContent = Pick<
  AdminReplyMailtoOptions,
  "subject" | "originalMessage" | "recipientName" | "openingLine"
>;

type ToastState = { message: string; type: "success" | "error" | "info" };

export function EmailReplyComposer({
  email,
  sendUrl,
  content,
  disabled,
  sentMessage = "Reply sent.",
  onSent
}: {
  /** Recipient on file; without one only the hint to add an email is shown. */
  email?: string;
  /** POST endpoint taking `{ replyText }`. */
  sendUrl: string;
  content: EmailReplyContent;
  disabled?: boolean;
  sentMessage?: string;
  onSent: () => void;
}) {
  const storeData = useStoreDetails();
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [resendConfigured, setResendConfigured] = useState<boolean | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const to = email?.trim();
  const canSend = Boolean(to) && replyText.trim().length > 0 && !sending && !disabled && resendConfigured !== false;

  useEffect(() => {
    fetch("/api/v1/admin/messages/reply/status")
      .then(res => res.json())
      .then(data => setResendConfigured(Boolean(data?.data?.configured)))
      .catch(() => setResendConfigured(false));
  }, []);

  const mailOptions = useMemo<AdminReplyMailtoOptions | null>(
    () =>
      to
        ? {
            ...content,
            to,
            adminReply: replyText.trim() || undefined,
            siteBaseUrl: resolveSiteBaseUrl(storeData?.seo),
            storeTitle: storeData?.title,
            footerLinks: resolveEmailFooterLinks(storeData)
          }
        : null,
    [content, replyText, storeData, to]
  );

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const res = await fetch(sendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText: replyText.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to send reply");
      setReplyText("");
      setToast({ message: sentMessage, type: "success" });
      onSent();
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Failed to send reply", type: "error" });
    } finally {
      setSending(false);
    }
  };

  const openMailApp = async () => {
    if (!mailOptions) return;
    const copied = await openAdminReplyEmail(mailOptions);
    setToast({
      message: copied
        ? "Opening mail app — formatted reply copied. Paste into the body (Ctrl+V) for styling."
        : "Opening mail app — plain-text body was prefilled.",
      type: "info"
    });
  };

  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-2.5 dark:border-gray-800">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
          <FaEnvelope className="h-3.5 w-3.5 text-gray-400" aria-hidden />
          Reply by email
        </h3>
        {to ? (
          <span className="truncate text-xs text-gray-500 dark:text-gray-400">
            To <span className="font-medium text-gray-700 dark:text-gray-200">{to}</span>
            {resendConfigured === false ? " · Resend not configured, use the mail app" : ""}
          </span>
        ) : (
          <span className="text-xs text-amber-700 dark:text-amber-300">Add an email address to reply</span>
        )}
      </div>
      <div className="p-3">
        <textarea
          aria-label="Reply"
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void send();
          }}
          rows={5}
          maxLength={MAX_REPLY_BODY_LENGTH}
          disabled={!to || sending || disabled}
          placeholder="Write your reply. The greeting, their original text and the KeyAway footer are added automatically."
          className="min-h-30 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void send()}
            disabled={!canSend}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50">
            <FaPaperPlane className="h-3 w-3" aria-hidden />
            {sending ? "Sending…" : "Send HTML reply"}
          </button>
          {mailOptions && (
            <button
              type="button"
              onClick={() => void openMailApp()}
              disabled={sending || disabled}
              className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50">
              Open in mail app
            </button>
          )}
          <span className="ml-auto text-[11px] tabular-nums text-gray-400">Ctrl+Enter to send</span>
        </div>
      </div>

      {toast && typeof document !== "undefined"
        ? createPortal(
            <Toast
              message={toast.message}
              type={toast.type}
              duration={NOTIFICATION_DURATION.MEDIUM}
              onClose={() => setToast(null)}
            />,
            document.body
          )
        : null}
    </section>
  );
}

/** Sent replies, newest first. */
export function EmailReplyHistory({ replies }: { replies?: ContactMessageReply[] }) {
  if (!replies?.length) return null;
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Sent replies ({replies.length})</h3>
      <ol className="space-y-3 border-l-2 border-gray-200 pl-4 dark:border-gray-800">
        {[...replies].reverse().map(reply => (
          <li key={reply._key ?? `${reply.sentAt}-${reply.sentBy}`} className="relative">
            <span
              aria-hidden
              className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 dark:border-gray-900"
            />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {reply.sentAt ? new Date(reply.sentAt).toLocaleString() : ""}
              </span>
              <span>
                {reply.sentBy} → {reply.sentTo}
              </span>
              {reply.resendId ? <span className="font-mono">#{reply.resendId.slice(0, 8)}</span> : null}
            </div>
            <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-800/50">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{reply.subject}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{reply.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
