"use client";

import { useState } from "react";
import { ContactMessage } from "@/src/types/contact";
import { messageHasNoEmail, messageNeedsReply } from "@/src/lib/admin/contactMessages";
import MessageDetailsModal from "./MessageDetailsModal";
import {
  AdminListCard,
  AdminPagination,
  Chip,
  RelativeDate,
  StatusPill,
  adminRow
} from "@/src/components/admin/list/AdminListKit";
import { MESSAGE_STATUS_OPTIONS, MESSAGE_STATUS_TONES } from "@/src/components/admin/messages/messageStatus";

export type MessageUpdatePayload = Partial<Pick<ContactMessage, "status" | "email" | "name">>;

interface MessagesTableProps {
  /** Current page. */
  messages: ContactMessage[];
  /** Every message, so an open details modal survives a status change that filters its row out. */
  all: ContactMessage[];
  total: number;
  loading: boolean;
  paging: { page: number; totalPages: number; pageSize: number; setPage: (page: number) => void };
  onUpdate: () => void;
}

export default function MessagesTable({ messages, all, total, loading, paging, onUpdate }: MessagesTableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const selected = all.find(m => m._id === selectedId) ?? null;

  const handleUpdateMessage = async (messageId: string, updates: MessageUpdatePayload) => {
    if (Object.keys(updates).length === 0) return;
    setUpdating(messageId);
    try {
      const res = await fetch(`/api/v1/admin/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message ?? data?.error ?? "Update failed");
      onUpdate();
    } catch (error) {
      console.error("Error updating message:", error);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <>
      <AdminListCard
        title="Messages"
        meta={`${total.toLocaleString()} ${total === 1 ? "result" : "results"}`}
        footer={
          total > 0 && (
            <AdminPagination
              page={paging.page}
              totalPages={paging.totalPages}
              total={total}
              pageSize={paging.pageSize}
              onPageChange={paging.setPage}
            />
          )
        }>
        {loading ? (
          <p className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">No messages match these filters.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {messages.map(message => {
              const replyCount = message.replies?.length ?? 0;
              const sender = message.name?.trim() || message.email?.trim() || "Anonymous";
              return (
                <li key={message._id} className={`${adminRow} flex gap-3 px-4 py-3 sm:px-5`}>
                  <span
                    aria-hidden
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold uppercase ${
                      message.status === "new"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    }`}>
                    {sender.charAt(0)}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedId(message._id)}
                    className="min-w-0 flex-1 cursor-pointer text-left">
                    <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <span
                        className={`truncate text-sm text-gray-900 dark:text-gray-100 ${message.status === "new" ? "font-semibold" : "font-medium"}`}>
                        {message.title || "(no title)"}
                      </span>
                      {messageNeedsReply(message) && <Chip tone="amber">Needs reply</Chip>}
                      {messageHasNoEmail(message) && <Chip tone="red">No email</Chip>}
                    </span>
                    <span className="mt-0.5 block text-sm text-gray-600 line-clamp-2 dark:text-gray-400">{message.message}</span>
                    <span className="mt-1 block truncate text-xs text-gray-500 dark:text-gray-400">
                      {sender}
                      {message.email && message.name ? ` · ${message.email}` : ""}
                      {replyCount > 0 && (
                        <>
                          {" · "}
                          {replyCount} {replyCount === 1 ? "reply" : "replies"}
                          {message.lastRepliedAt && (
                            <>
                              {", last "}
                              <RelativeDate iso={message.lastRepliedAt} />
                            </>
                          )}
                        </>
                      )}
                    </span>
                  </button>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <StatusPill
                      value={message.status ?? "new"}
                      options={MESSAGE_STATUS_OPTIONS}
                      tones={MESSAGE_STATUS_TONES}
                      disabled={updating === message._id}
                      onChange={status => handleUpdateMessage(message._id, { status })}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      <RelativeDate iso={message.createdAt} />
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminListCard>

      {selected && (
        <MessageDetailsModal
          message={selected}
          onClose={() => setSelectedId(null)}
          onUpdateMessage={updates => handleUpdateMessage(selected._id, updates)}
          onReplySent={onUpdate}
          updating={updating === selected._id}
        />
      )}
    </>
  );
}
