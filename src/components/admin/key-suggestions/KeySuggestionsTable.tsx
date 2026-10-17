"use client";

import { useState } from "react";
import { KeySuggestion } from "@/src/types/contact";
import AdminViewDetailsButton from "@/src/components/admin/AdminViewDetailsButton";
import SuggestionDetailsModal from "./SuggestionDetailsModal";
import {
  AdminEmptyRows,
  AdminListCard,
  AdminPagination,
  RelativeDate,
  StatusPill,
  adminRow,
  adminTd,
  adminTh,
  adminTheadRow,
  pillTones
} from "@/src/components/admin/list/AdminListKit";

export type SuggestionUpdatePayload = Partial<Pick<KeySuggestion, "status" | "email" | "name">>;

const STATUS_OPTIONS: Array<{ value: KeySuggestion["status"]; label: string }> = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "added", label: "Added" },
  { value: "rejected", label: "Rejected" }
];

const STATUS_TONES: Record<KeySuggestion["status"], string> = {
  new: pillTones.blue,
  reviewing: pillTones.amber,
  added: pillTones.green,
  rejected: pillTones.gray
};

function hostOf(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

interface KeySuggestionsTableProps {
  /** Current page. */
  suggestions: KeySuggestion[];
  /** Every suggestion, so an open details modal survives a status change that filters its row out. */
  all: KeySuggestion[];
  total: number;
  loading: boolean;
  paging: { page: number; totalPages: number; pageSize: number; setPage: (page: number) => void };
  onUpdate: () => void;
}

export default function KeySuggestionsTable({
  suggestions,
  all,
  total,
  loading,
  paging,
  onUpdate
}: KeySuggestionsTableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const selected = all.find(s => s._id === selectedId) ?? null;

  const handleUpdateSuggestion = async (suggestionId: string, updates: SuggestionUpdatePayload) => {
    if (Object.keys(updates).length === 0) return;
    setUpdating(suggestionId);
    try {
      const res = await fetch(`/api/v1/admin/key-suggestions/${suggestionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message ?? data?.error ?? "Update failed");
      onUpdate();
    } catch (error) {
      console.error("Error updating suggestion:", error);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <>
      <AdminListCard
        title="Suggestions"
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
                <th className={adminTh}>Program</th>
                <th className={adminTh}>Key</th>
                <th className={`${adminTh} hidden lg:table-cell`}>From</th>
                <th className={adminTh}>Status</th>
                <th className={adminTh}>Submitted</th>
                <th className={adminTh} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <AdminEmptyRows colSpan={6}>Loading suggestions…</AdminEmptyRows>
              ) : suggestions.length === 0 ? (
                <AdminEmptyRows colSpan={6}>No suggestions match these filters.</AdminEmptyRows>
              ) : (
                suggestions.map(s => (
                  <tr key={s._id} className={adminRow}>
                    <td className={`${adminTd} max-w-64`}>
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{s.programName}</div>
                      {s.programLink && (
                        <a
                          href={s.programLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 dark:text-sky-400 hover:underline truncate block">
                          {hostOf(s.programLink)}
                        </a>
                      )}
                    </td>
                    <td className={adminTd}>
                      <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs font-mono text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {s.cdKey}
                      </code>
                      {s.programVersion && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">v{s.programVersion}</div>
                      )}
                    </td>
                    <td className={`${adminTd} hidden lg:table-cell max-w-56`}>
                      <div className="text-gray-900 dark:text-gray-100 truncate">{s.name || "—"}</div>
                      {s.email && <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.email}</div>}
                    </td>
                    <td className={adminTd}>
                      <StatusPill
                        value={s.status}
                        options={STATUS_OPTIONS}
                        tones={STATUS_TONES}
                        disabled={updating === s._id}
                        onChange={status => handleUpdateSuggestion(s._id, { status })}
                      />
                    </td>
                    <td className={`${adminTd} text-xs text-gray-500 dark:text-gray-400`}>
                      <RelativeDate iso={s.createdAt} />
                    </td>
                    <td className={`${adminTd} text-right`}>
                      <AdminViewDetailsButton onClick={() => setSelectedId(s._id)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminListCard>

      {selected && (
        <SuggestionDetailsModal
          suggestion={selected}
          onClose={() => setSelectedId(null)}
          onUpdateSuggestion={updates => handleUpdateSuggestion(selected._id, updates)}
          updating={updating === selected._id}
        />
      )}
    </>
  );
}
