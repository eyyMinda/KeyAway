"use client";

import { useState } from "react";
import { ContactMessage } from "@/src/types/contact";
import MessageDetailsModal from "./MessageDetailsModal";
import SortableTableHead, { SortableColumn, SortDirection } from "@/src/components/ui/SortableTableHead";

interface MessagesTableProps {
  messages: ContactMessage[];
  onUpdate: () => void;
  sortColumn?: string;
  sortDirection?: SortDirection;
  onSort?: (column: string) => void;
}

export default function MessagesTable({ messages, onUpdate, sortColumn, sortDirection, onSort }: MessagesTableProps) {
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const tableColumns: SortableColumn[] = [
    { key: "title", label: "Title", sortable: true, className: "text-left" },
    { key: "contact", label: "Contact", sortable: false, className: "text-left" },
    { key: "status", label: "Status", sortable: true, className: "text-center" },
    { key: "createdAt", label: "Date", sortable: true, className: "text-center" },
    { key: "actions", label: "Actions", sortable: false, className: "text-center" }
  ];

  const handleStatusChange = async (messageId: string, newStatus: ContactMessage["status"]) => {
    setUpdating(messageId);
    try {
      const res = await fetch("/api/admin/update-message-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, newStatus })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Update failed");
      }
      onUpdate();
    } catch (error) {
      console.error("Error updating message status:", error);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: ContactMessage["status"]) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "read":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "replied":
        return "bg-green-100 text-green-800 border-green-300";
      case "archived":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (messages.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-12 text-center">
        <div className="text-4xl mb-4">📬</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
        <p className="text-gray-500">No contact messages match the current filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Contact Messages</h3>
          <p className="text-sm text-gray-500 mt-1">Total: {messages.length}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <SortableTableHead
              columns={tableColumns}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <tbody className="divide-y divide-gray-200">
              {messages.map(message => (
                <tr key={message._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{message.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-md">{message.message.slice(0, 60)}...</div>
                  </td>
                  <td className="px-6 py-4">
                    {message.name || message.email ? (
                      <div className="text-sm">
                        {message.name && <div className="font-medium text-gray-900">{message.name}</div>}
                        {message.email && <div className="text-gray-500">{message.email}</div>}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Anonymous</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <select
                        value={message.status}
                        onChange={e => handleStatusChange(message._id, e.target.value as ContactMessage["status"])}
                        disabled={updating === message._id}
                        className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer ${getStatusColor(message.status)} disabled:opacity-50`}>
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="replied">Replied</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-500">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => setSelectedMessage(message)}
                        className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors cursor-pointer">
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedMessage && (
        <MessageDetailsModal
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          onStatusChange={(newStatus: ContactMessage["status"]) => {
            handleStatusChange(selectedMessage._id, newStatus);
            setSelectedMessage(null);
          }}
        />
      )}
    </>
  );
}
