"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useStoreDetails } from "@/src/components/providers/StoreDetailsProvider";
import Toast from "@/src/components/ui/Toast";
import { ModalCloseButton } from "@/src/components/ui/ModalCloseButton";
import AdminVisitorSection from "@/src/components/admin/AdminVisitorSection";
import { openAdminReplyEmail } from "@/src/lib/email/openAdminReplyEmail";
import { resolveEmailFooterLinks } from "@/src/lib/email/resolveEmailFooterLinks";
import { MAX_REPLY_BODY_LENGTH } from "@/src/lib/email/sendContactMessageReply";
import { resolveSiteBaseUrl } from "@/src/lib/seo/storeSeoResolve";
import { NOTIFICATION_DURATION } from "@/src/lib/notifications/notificationUtils";
import { ContactMessage } from "@/src/types/contact";
import type { MessageUpdatePayload } from "./MessagesTable";

interface MessageDetailsModalProps {
  message: ContactMessage;
  onClose: () => void;
  onUpdateMessage: (updates: MessageUpdatePayload) => void;
  onReplySent: () => void;
  updating?: boolean;
}

export default function MessageDetailsModal({
  message,
  onClose,
  onUpdateMessage,
  onReplySent,
  updating
}: MessageDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const markedReadRef = useRef<string | null>(null);
  const storeData = useStoreDetails();
  const [emailInput, setEmailInput] = useState(message.email ?? "");
  const [emailSaved, setEmailSaved] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [resendConfigured, setResendConfigured] = useState<boolean | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const replyEmailOptions = useMemo(() => {
    const to = message.email?.trim();
    if (!to) return null;

    return {
      to,
      subject: message.title ?? "",
      originalMessage: message.message,
      adminReply: replyText.trim() || undefined,
      recipientName: message.name,
      siteBaseUrl: resolveSiteBaseUrl(storeData?.seo),
      storeTitle: storeData?.title,
      footerLinks: resolveEmailFooterLinks(storeData)
    };
  }, [
    message.email,
    message.message,
    message.name,
    message.title,
    replyText,
    storeData?.seo,
    storeData?.socialLinks,
    storeData?.otherLinks,
    storeData?.title
  ]);

  const replies = message.replies ?? [];
  const canSendReply = Boolean(message.email?.trim()) && replyText.trim().length > 0 && !sending && !updating;

  useEffect(() => {
    fetch("/api/v1/admin/messages/reply/status")
      .then(res => res.json())
      .then(data => setResendConfigured(Boolean(data?.data?.configured)))
      .catch(() => setResendConfigured(false));
  }, []);

  useEffect(() => {
    if (message.status !== "new") return;
    if (markedReadRef.current === message._id) return;
    markedReadRef.current = message._id;
    onUpdateMessage({ status: "read" });
  }, [message._id, message.status, onUpdateMessage]);

  useEffect(() => {
    setEmailInput(message.email ?? "");
  }, [message._id, message.email]);

  const handleSaveEmail = useCallback(() => {
    const trimmed = emailInput.trim();
    if (trimmed === (message.email ?? "").trim()) return;
    onUpdateMessage({ email: trimmed || undefined });
    setEmailSaved(true);
    setTimeout(() => setEmailSaved(false), 2000);
  }, [emailInput, message.email, onUpdateMessage]);

  const handleSendViaResend = useCallback(async () => {
    if (!canSendReply) return;

    setSending(true);
    try {
      const res = await fetch(`/api/v1/admin/messages/${message._id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText: replyText.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error?.message ?? "Failed to send reply";
        throw new Error(msg);
      }

      setReplyText("");
      setToast({ message: "Reply sent — status updated to Replied.", type: "success" });
      onReplySent();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Failed to send reply",
        type: "error"
      });
    } finally {
      setSending(false);
    }
  }, [canSendReply, message._id, onReplySent, replyText]);

  const handleOpenMailApp = useCallback(async () => {
    if (!replyEmailOptions) return;

    const copied = await openAdminReplyEmail(replyEmailOptions);
    setToast({
      message: copied
        ? "Opening mail app — formatted reply copied. Paste into the body (Ctrl+V) for styling."
        : "Opening mail app — plain-text body was prefilled.",
      type: "info"
    });
  }, [replyEmailOptions]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        style={{ animation: "slideDown 0.3s ease-out" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900">Message Details</h2>
          <ModalCloseButton
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg"
            iconClassName="h-5 w-5"
            aria-label="Close modal"
          />
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Subject</label>
            <p className="text-lg font-semibold text-gray-900">{message.title ?? "-"}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Message</label>
            <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200">
              {message.message ?? "-"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
              <p className="text-gray-900">{message.name?.trim() ? message.name : "-"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
              <div className="flex gap-2 items-center">
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSaveEmail()}
                  placeholder="Add or edit email..."
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 text-sm"
                  disabled={updating || sending}
                />
                <button
                  type="button"
                  onClick={handleSaveEmail}
                  disabled={updating || sending || emailInput.trim() === (message.email ?? "").trim()}
                  className="shrink-0 px-3 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {emailSaved ? "Saved" : "Save"}
                </button>
              </div>
              {!message.email?.trim() && !emailInput.trim() ? (
                <p className="mt-1 text-xs text-amber-600">Add an email address to send a reply.</p>
              ) : null}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="admin-reply-text" className="block text-sm font-medium text-gray-700">
                Your reply
              </label>
              {resendConfigured === false ? (
                <span className="text-xs text-amber-600">Resend not configured — use mail app fallback</span>
              ) : resendConfigured ? (
                <span className="text-xs text-green-600">HTML email via Resend</span>
              ) : null}
            </div>
            <textarea
              id="admin-reply-text"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              rows={5}
              maxLength={MAX_REPLY_BODY_LENGTH}
              placeholder="Write your reply here. The original message and KeyAway footer are added automatically."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 text-sm resize-y min-h-[120px]"
              disabled={sending || updating}
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSendViaResend}
                disabled={!canSendReply || resendConfigured === false}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {sending ? "Sending…" : "Send HTML reply"}
              </button>
              {replyEmailOptions ? (
                <button
                  type="button"
                  onClick={handleOpenMailApp}
                  disabled={sending || updating}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Open in mail app
                </button>
              ) : null}
            </div>
          </div>

          {replies.length > 0 ? (
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Reply history ({replies.length})
              </h3>
              <ul className="space-y-3">
                {[...replies].reverse().map(reply => (
                  <li
                    key={reply._key ?? `${reply.sentAt}-${reply.sentBy}`}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-2">
                      <span>{reply.sentBy}</span>
                      <span>→ {reply.sentTo}</span>
                      <span>{reply.sentAt ? new Date(reply.sentAt).toLocaleString() : ""}</span>
                      {reply.resendId ? <span className="font-mono">#{reply.resendId.slice(0, 8)}</span> : null}
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">{reply.subject}</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Received</label>
              <p className="text-gray-900">{message.createdAt ? new Date(message.createdAt).toLocaleString() : "-"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Last replied</label>
              <p className="text-gray-900">
                {message.lastRepliedAt ? new Date(message.lastRepliedAt).toLocaleString() : "-"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
              <select
                value={message.status ?? "new"}
                onChange={e => onUpdateMessage({ status: e.target.value as ContactMessage["status"] })}
                disabled={updating || sending}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer text-gray-900 disabled:opacity-50">
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <AdminVisitorSection ipHash={message.ipHash} />
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors cursor-pointer">
            Close
          </button>
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
    </div>
  );
}
