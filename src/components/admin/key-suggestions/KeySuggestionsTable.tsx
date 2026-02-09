"use client";

import { useState, useEffect } from "react";
import { KeySuggestion } from "@/src/types/contact";
import SuggestionDetailsModal from "./SuggestionDetailsModal";
import SortableTableHead, { SortableColumn, SortDirection } from "@/src/components/ui/SortableTableHead";

export type SuggestionUpdatePayload = Partial<Pick<KeySuggestion, "status" | "email" | "name">>;

interface KeySuggestionsTableProps {
  suggestions: KeySuggestion[];
  onUpdate: () => void;
  sortColumn?: string;
  sortDirection?: SortDirection;
  onSort?: (column: string) => void;
}

export default function KeySuggestionsTable({
  suggestions,
  onUpdate,
  sortColumn,
  sortDirection,
  onSort
}: KeySuggestionsTableProps) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<KeySuggestion | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const selectedId = selectedSuggestion?._id;
  useEffect(() => {
    if (!selectedId || !suggestions.length) return;
    const updated = suggestions.find(s => s._id === selectedId);
    if (updated) setSelectedSuggestion(updated);
  }, [suggestions, selectedId]);

  const handleUpdateSuggestion = async (suggestionId: string, updates: SuggestionUpdatePayload) => {
    if (Object.keys(updates).length === 0) return;
    setUpdating(suggestionId);
    try {
      const res = await fetch("/api/admin/update-key-suggestion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestionId, ...updates })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Update failed");
      onUpdate();
    } catch (error) {
      console.error("Error updating suggestion:", error);
    } finally {
      setUpdating(null);
    }
  };

  const tableColumns: SortableColumn[] = [
    { key: "programName", label: "Program", sortable: true, className: "text-left" },
    { key: "cdKey", label: "CD Key", sortable: false, className: "text-left" },
    { key: "version", label: "Version", sortable: false, className: "text-center" },
    { key: "status", label: "Status", sortable: true, className: "text-center" },
    { key: "createdAt", label: "Date", sortable: true, className: "text-center" },
    { key: "actions", label: "Actions", sortable: false, className: "text-center" }
  ];

  const getStatusColor = (status: KeySuggestion["status"]) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "reviewing":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "added":
        return "bg-green-100 text-green-800 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-12 text-center">
        <div className="text-4xl mb-4">🔑</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions found</h3>
        <p className="text-gray-500">No key suggestions match the current filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">CD Key Suggestions</h3>
          <p className="text-sm text-gray-500 mt-1">Total: {suggestions.length}</p>
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
              {suggestions.map(suggestion => {
                const isRejected = suggestion.status === "rejected";
                return (
                  <tr key={suggestion._id} className={`hover:bg-gray-50 ${isRejected ? "bg-gray-50 opacity-75" : ""}`}>
                    <td className="px-6 py-4">
                      <div className={`font-medium truncate ${isRejected ? "text-gray-500" : "text-gray-900"}`}>
                        {suggestion.programName}
                      </div>
                      <a
                        href={suggestion.programLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-xs truncate max-w-xs block ${isRejected ? "text-gray-400" : "text-primary-600 hover:text-primary-700"}`}>
                        {suggestion.programLink}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <code
                        className={`px-2 py-1 bg-gray-100 whitespace-nowrap rounded text-sm font-mono ${isRejected ? "text-gray-500" : "text-gray-900"}`}>
                        {suggestion.cdKey}
                      </code>
                    </td>
                    <td className={`px-6 py-4 text-center text-sm ${isRejected ? "text-gray-500" : "text-gray-900"}`}>
                      v{suggestion.programVersion}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <select
                          value={suggestion.status}
                          onChange={e =>
                            handleUpdateSuggestion(suggestion._id, {
                              status: e.target.value as KeySuggestion["status"]
                            })
                          }
                          disabled={updating === suggestion._id}
                          className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer ${getStatusColor(suggestion.status)} disabled:opacity-50`}>
                          <option value="new">New</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="added">Added</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-center text-sm ${isRejected ? "text-gray-400" : "text-gray-500"}`}>
                      {new Date(suggestion.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => setSelectedSuggestion(suggestion)}
                          className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors cursor-pointer">
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedSuggestion && (
        <SuggestionDetailsModal
          suggestion={selectedSuggestion}
          onClose={() => setSelectedSuggestion(null)}
          onUpdateSuggestion={updates => handleUpdateSuggestion(selectedSuggestion._id, updates)}
          updating={updating === selectedSuggestion._id}
        />
      )}
    </>
  );
}
