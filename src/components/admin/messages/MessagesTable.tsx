"use client";

import { useState } from "react";
import { ContactMessage } from "@/src/types/contact";
import { messageHasNoEmail, messageNeedsReply } from "@/src/lib/admin/contactMessages";
import AdminViewDetailsButton from "@/src/components/admin/AdminViewDetailsButton";
import MessageDetailsModal from "./MessageDetailsModal";
import {
  AdminEmptyRows,
  AdminListCard,
  AdminPagination,
  Chip,
  RelativeDate,
  StatusPill,
  adminRow,
  adminTd,
  adminTh,
  adminTheadRow,
  pillTones
} from "@/src/components/admin/list/AdminListKit";

export type MessageUpdatePayload = Partial<Pick<ContactMessage, "status" | "email" | "name">>;

const STATUS_OPTIONS: Array<{ value: ContactMessage["status"]; label: string }> = [
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" }
];

const STATUS_TONES: Record<ContactMessage["status"], string> = {
  new: pillTones.blue,
  read: pillTones.gray,
  replied: pillTones.green,
  archived: pillTones.purple
};

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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={adminTheadRow}>
              <tr>
                <th className={adminTh}>Message</th>
                <th className={`${adminTh} hidden md:table-cell`}>From</th>
                <th className={adminTh}>Status</th>
                <th className={`${adminTh} hidden lg:table-cell`}>Replies</th>
                <th className={adminTh}>Received</th>
                <th className={adminTh} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <AdminEmptyRows colSpan={6}>Loading messages…</AdminEmptyRows>
              ) : messages.length === 0 ? (
                <AdminEmptyRows colSpan={6}>No messages match these filters.</AdminEmptyRows>
              ) : (
                messages.map(message => {
                  const replyCount = message.replies?.length ?? 0;
                  const needsReply = messageNeedsReply(message);
                  const noEmail = messageHasNoEmail(message);
                  return (
                    <tr key={message._id} className={adminRow}>
                      <td className={`${adminTd} max-w-md`}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {message.title || "(no title)"}
                          </span>
                          {needsReply && <Chip tone="amber">Needs reply</Chip>}
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{message.message}</p>
                      </td>
                      <td className={`${adminTd} hidden md:table-cell max-w-56`}>
                        <div className="text-gray-900 dark:text-gray-100 truncate">{message.name || "—"}</div>
                        {noEmail ? (
                          <Chip tone="red">No email</Chip>
                        ) : (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{message.email}</div>
                        )}
                      </td>
                      <td className={adminTd}>
                        <StatusPill
                          value={message.status ?? "new"}
                          options={STATUS_OPTIONS}
                          tones={STATUS_TONES}
                          disabled={updating === message._id}
                          onChange={status => handleUpdateMessage(message._id, { status })}
                        />
                      </td>
                      <td className={`${adminTd} hidden lg:table-cell text-xs text-gray-500 dark:text-gray-400`}>
                        {replyCount > 0 ? (
                          <>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{replyCount}</span>
                            {message.lastRepliedAt && (
                              <span>
                                {" "}
                                · <RelativeDate iso={message.lastRepliedAt} />
                              </span>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className={`${adminTd} text-xs text-gray-500 dark:text-gray-400`}>
                        <RelativeDate iso={message.createdAt} />
                      </td>
                      <td className={`${adminTd} text-right`}>
                        <AdminViewDetailsButton onClick={() => setSelectedId(message._id)} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
