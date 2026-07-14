"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import MessagesTable from "@/src/components/admin/messages/MessagesTable";
import ReplyEmailTemplatePreview from "@/src/components/admin/messages/ReplyEmailTemplatePreview";
import SearchInput from "@/src/components/ui/SearchInput";
import {
  filterMessagesByQuickFilter,
  getMessageStats,
  MESSAGE_QUICK_FILTERS,
  type MessageQuickFilter
} from "@/src/lib/admin/contactMessages";
import { ContactMessage } from "@/src/types/contact";
import { client } from "@/src/sanity/lib/client";
import { SortDirection } from "@/src/components/ui/SortableTableHead";

const MESSAGES_QUERY = `*[_type == "contactMessage"] | order(createdAt desc) {
  _id,
  _createdAt,
  title,
  message,
  name,
  email,
  ipHash,
  status,
  createdAt,
  lastRepliedAt,
  replies[]{
    _key,
    body,
    subject,
    sentTo,
    sentBy,
    sentAt,
    resendId
  }
}`;

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [quickFilter, setQuickFilter] = useState<MessageQuickFilter>("all");
  const [sortColumn, setSortColumn] = useState<string>("status");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const result = await client.fetch<ContactMessage[]>(MESSAGES_QUERY);
      setMessages(result);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const stats = useMemo(() => getMessageStats(messages), [messages]);

  const filteredAndSortedMessages = useMemo(() => {
    const search = searchTerm.toLowerCase();

    const filtered = filterMessagesByQuickFilter(messages, quickFilter).filter(msg => {
      if (!search) return true;
      return (
        msg.title.toLowerCase().includes(search) ||
        msg.message.toLowerCase().includes(search) ||
        msg.name?.toLowerCase().includes(search) ||
        msg.email?.toLowerCase().includes(search) ||
        msg.replies?.some(
          reply =>
            reply.body.toLowerCase().includes(search) ||
            reply.sentBy.toLowerCase().includes(search) ||
            reply.subject.toLowerCase().includes(search)
        )
      );
    });

    const statusOrder: Record<string, number> = { new: 0, read: 1, replied: 2, archived: 3 };
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case "title":
          cmp = (a.title ?? "").localeCompare(b.title ?? "");
          break;
        case "status":
          cmp = (statusOrder[a.status] ?? 0) - (statusOrder[b.status] ?? 0);
          break;
        case "createdAt":
          cmp = new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
          break;
        default:
          return 0;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [messages, searchTerm, quickFilter, sortColumn, sortDirection]);

  if (loading) {
    return (
      <ProtectedAdminLayout title="Messages" subtitle="Manage contact messages">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading messages...</div>
        </div>
      </ProtectedAdminLayout>
    );
  }

  return (
    <ProtectedAdminLayout title="Messages" subtitle="Manage contact messages">
      <div className="mb-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: "Total", value: stats.total, tone: "text-gray-900" },
          { label: "New", value: stats.new, tone: "text-blue-700" },
          { label: "Needs reply", value: stats.needsReply, tone: "text-amber-700" },
          { label: "No email", value: stats.noEmail, tone: "text-red-700" },
          { label: "Replied", value: stats.replied, tone: "text-green-700" },
          { label: "Archived", value: stats.archived, tone: "text-purple-700" }
        ].map(item => (
          <div key={item.label} className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-soft">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{item.label}</div>
            <div className={`mt-1 text-2xl font-bold ${item.tone}`}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6 space-y-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search messages, emails, or reply history..."
            className="w-full"
          />

          <div className="flex flex-wrap gap-2">
            {MESSAGE_QUICK_FILTERS.map(filter => {
              const count =
                filter.id === "all"
                  ? stats.total
                  : filter.id === "needs_reply"
                    ? stats.needsReply
                    : filter.id === "no_email"
                      ? stats.noEmail
                      : filter.id === "replied"
                        ? stats.replied
                        : stats.archived;
              const active = quickFilter === filter.id;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setQuickFilter(filter.id)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}>
                  {filter.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <MessagesTable
        messages={filteredAndSortedMessages}
        onUpdate={fetchMessages}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      <ReplyEmailTemplatePreview />
    </ProtectedAdminLayout>
  );
}
