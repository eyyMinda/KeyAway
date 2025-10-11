"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import KeySuggestionsTable from "@/src/components/admin/key-suggestions/KeySuggestionsTable";
import SearchInput from "@/src/components/ui/SearchInput";
import { KeySuggestion } from "@/src/types/contact";
import { client } from "@/src/sanity/lib/client";
import { SortDirection } from "@/src/components/ui/SortableTableHead";

export default function KeySuggestionsPage() {
  const [suggestions, setSuggestions] = useState<KeySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const result = await client.fetch<KeySuggestion[]>(
        `*[_type == "keySuggestion"] | order(createdAt desc) {
          _id,
          _createdAt,
          cdKey,
          programName,
          programVersion,
          programLink,
          name,
          email,
          message,
          status,
          createdAt
        }`
      );
      setSuggestions(result);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
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

  const filteredAndSortedSuggestions = useMemo(() => {
    const filtered = suggestions.filter(sug => {
      const matchesSearch =
        sug.programName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sug.cdKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sug.programVersion.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || sug.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case "programName":
          cmp = a.programName.localeCompare(b.programName);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "createdAt":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [suggestions, searchTerm, statusFilter, sortColumn, sortDirection]);

  if (loading) {
    return (
      <ProtectedAdminLayout title="Key Suggestions" subtitle="Manage suggested CD keys">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading suggestions...</div>
        </div>
      </ProtectedAdminLayout>
    );
  }

  return (
    <ProtectedAdminLayout title="Key Suggestions" subtitle="Manage suggested CD keys">
      {/* Filters */}
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search suggestions..."
              className="w-full"
            />

            {/* Status Filter */}
            <div>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900">
                <option value="all">All Suggestions ({suggestions.length})</option>
                <option value="new">New ({suggestions.filter(s => s.status === "new").length})</option>
                <option value="reviewing">
                  Reviewing ({suggestions.filter(s => s.status === "reviewing").length})
                </option>
                <option value="added">Added ({suggestions.filter(s => s.status === "added").length})</option>
                <option value="rejected">Rejected ({suggestions.filter(s => s.status === "rejected").length})</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions Table */}
      <KeySuggestionsTable
        suggestions={filteredAndSortedSuggestions}
        onUpdate={fetchSuggestions}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
      />
    </ProtectedAdminLayout>
  );
}
