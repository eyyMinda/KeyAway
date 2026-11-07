"use client";

import { useEffect, useMemo, useRef } from "react";
import AdminDetailsModal from "@/src/components/admin/AdminDetailsModal";
import ContactField from "@/src/components/admin/email/ContactField";
import { EmailReplyComposer, EmailReplyHistory } from "@/src/components/admin/email/EmailReplyPanel";
import { RelativeDate, StatusPill } from "@/src/components/admin/list/AdminListKit";
import { MESSAGE_STATUS_OPTIONS, MESSAGE_STATUS_TONES } from "@/src/components/admin/messages/messageStatus";
import { ContactMessage } from "@/src/types/contact";
import type { MessageUpdatePayload } from "./MessagesTable";

interface MessageDetailsModalProps {
  message: ContactMessage;
  onClose: () => void;
  onUpdateMessage: (updates: MessageUpdatePayload) => void;
  onReplySent: () => void;
  updating?: boolean;
}

const fullDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

export default function MessageDetailsModal({
  message,
  onClose,
  onUpdateMessage,
  onReplySent,
  updating
}: MessageDetailsModalProps) {
  const markedReadRef = useRef<string | null>(null);
  const content = useMemo(
    () => ({ subject: message.title ?? "", originalMessage: message.message, recipientName: message.name }),
    [message.title, message.message, message.name]
  );

  useEffect(() => {
    if (message.status !== "new") return;
    if (markedReadRef.current === message._id) return;
    markedReadRef.current = message._id;
    onUpdateMessage({ status: "read" });
  }, [message._id, message.status, onUpdateMessage]);

  return (
    <AdminDetailsModal
      title="Message"
      subtitle={message.name?.trim() || message.email?.trim() || "Anonymous visitor"}
      onClose={onClose}
      visitorHash={message.ipHash}
      visitorPosition="bottom"
      maxWidthClass="max-w-3xl"
      footer={
        <span>
          Received {fullDate(message.createdAt)}
          {message.lastRepliedAt ? ` · last replied ${fullDate(message.lastRepliedAt)}` : ""}
        </span>
      }>
      <div className="space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-snug text-gray-900 dark:text-gray-100">
              {message.title || "(no title)"}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              <RelativeDate iso={message.createdAt} />
              {message.replies?.length
                ? ` · ${message.replies.length} sent ${message.replies.length === 1 ? "reply" : "replies"}`
                : ""}
            </p>
          </div>
          <StatusPill
            value={message.status ?? "new"}
            options={MESSAGE_STATUS_OPTIONS}
            tones={MESSAGE_STATUS_TONES}
            disabled={updating}
            onChange={status => onUpdateMessage({ status })}
          />
        </header>

        <blockquote className="whitespace-pre-wrap break-words rounded-xl border-l-4 border-primary-500 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-800 dark:bg-gray-800/50 dark:text-gray-200">
          {message.message || "—"}
        </blockquote>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ContactField
            label="Name"
            value={message.name}
            placeholder="Add a name…"
            disabled={updating}
            onSave={name => onUpdateMessage({ name })}
          />
          <ContactField
            label="Email"
            type="email"
            value={message.email}
            placeholder="Add an email to reply…"
            disabled={updating}
            onSave={email => onUpdateMessage({ email })}
          />
        </div>

        <EmailReplyComposer
          email={message.email}
          sendUrl={`/api/v1/admin/messages/${message._id}/reply`}
          content={content}
          disabled={updating}
          sentMessage="Reply sent — status updated to Replied."
          onSent={onReplySent}
        />

        <EmailReplyHistory replies={message.replies} />
      </div>
    </AdminDetailsModal>
  );
}
