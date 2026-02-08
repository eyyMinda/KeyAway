"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import MessagesTable from "@/src/components/admin/messages/MessagesTable";
import SearchInput from "@/src/components/ui/SearchInput";
import { ContactMessage } from "@/src/types/contact";
import { client } from "@/src/sanity/lib/client";
import { SortDirection } from "@/src/components/ui/SortableTableHead";

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortColumn, setSortColumn] = useState<string>("status");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const result = await client.fetch<ContactMessage[]>(
        `*[_type == "contactMessage"] | order(createdAt desc) {
          _id,
          _createdAt,
          title,
          message,
          name,
          email,
          status,
          createdAt
        }`
      );
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

  const filteredAndSortedMessages = useMemo(() => {
    const filtered = messages.filter(msg => {
      const matchesSearch =
        msg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || msg.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort (status order: new, read, replied, archived)
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
  }, [messages, searchTerm, statusFilter, sortColumn, sortDirection]);

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
      {/* Filters */}
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search messages..."
              className="w-full"
            />

            {/* Status Filter */}
            <div>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900">
                <option value="all">All Messages ({messages.length})</option>
                <option value="new">New ({messages.filter(m => m.status === "new").length})</option>
                <option value="read">Read ({messages.filter(m => m.status === "read").length})</option>
                <option value="replied">Replied ({messages.filter(m => m.status === "replied").length})</option>
                <option value="archived">Archived ({messages.filter(m => m.status === "archived").length})</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Table */}
      <MessagesTable
        messages={filteredAndSortedMessages}
        onUpdate={fetchMessages}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
      />
    </ProtectedAdminLayout>
  );
}
