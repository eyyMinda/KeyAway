"use client";

import { useState } from "react";
import { KeySuggestion } from "@/src/types/contact";
import SuggestionDetailsModal from "./SuggestionDetailsModal";
import {
  AdminListCard,
  AdminPagination,
  Chip,
  RelativeDate,
  StatusPill,
  adminRow
} from "@/src/components/admin/list/AdminListKit";
import { SUGGESTION_STATUS_OPTIONS, SUGGESTION_STATUS_TONES } from "@/src/components/admin/key-suggestions/suggestionStatus";

export type SuggestionUpdatePayload = Partial<Pick<KeySuggestion, "status" | "email" | "name">>;

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
        {loading ? (
          <p className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">Loading suggestions…</p>
        ) : suggestions.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">No suggestions match these filters.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {suggestions.map(s => {
              const replyCount = s.replies?.length ?? 0;
              const sender = s.name?.trim() || s.email?.trim();
              return (
                <li key={s._id} className={`${adminRow} flex gap-3 px-4 py-3 sm:px-5`}>
                  <button type="button" onClick={() => setSelectedId(s._id)} className="min-w-0 flex-1 cursor-pointer text-left">
                    <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span
                        className={`truncate text-sm text-gray-900 dark:text-gray-100 ${s.status === "new" ? "font-semibold" : "font-medium"}`}>
                        {s.programName}
                      </span>
                      {s.programVersion && <span className="text-xs text-gray-500 dark:text-gray-400">v{s.programVersion}</span>}
                      {s.programLink && (
                        <span className="truncate text-xs text-sky-700 dark:text-sky-300">{hostOf(s.programLink)}</span>
                      )}
                    </span>
                    <code className="mt-1 inline-block max-w-full truncate rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                      {s.cdKey}
                    </code>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <span className="truncate">{sender ? `From ${sender}` : "Anonymous"}</span>
                      {s.email && s.name && <span className="truncate">· {s.email}</span>}
                      {replyCount > 0 ? (
                        <Chip tone="green">
                          {replyCount} {replyCount === 1 ? "reply" : "replies"} sent
                        </Chip>
                      ) : s.email ? (
                        <Chip tone="gray">Not replied</Chip>
                      ) : null}
                    </span>
                  </button>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <StatusPill
                      value={s.status}
                      options={SUGGESTION_STATUS_OPTIONS}
                      tones={SUGGESTION_STATUS_TONES}
                      disabled={updating === s._id}
                      onChange={status => handleUpdateSuggestion(s._id, { status })}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      <RelativeDate iso={s.createdAt} />
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminListCard>

      {selected && (
        <SuggestionDetailsModal
          suggestion={selected}
          onClose={() => setSelectedId(null)}
          onUpdateSuggestion={updates => handleUpdateSuggestion(selected._id, updates)}
          onReplySent={onUpdate}
          updating={updating === selected._id}
        />
      )}
    </>
  );
}
