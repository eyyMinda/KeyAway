"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Pagination from "@/src/components/ui/Pagination";
import SearchInput from "@/src/components/ui/SearchInput";
import DeleteCommentConfirmModal from "@/src/components/admin/comments/DeleteCommentConfirmModal";
import ProgramCommentDetailsModal from "@/src/components/admin/comments/ProgramCommentDetailsModal";
import { FaChevronDown, FaTrash } from "react-icons/fa";
import type { SortDirection } from "@/src/components/ui/SortableTableHead";
import { visitorTierBadgeClasses } from "@/src/theme/colorSchema";
import type { AdminProgramCommentRow } from "@/src/types/admin/programComments";

const PREVIEW_LEN = 100;

function truncateBody(body: string, max = PREVIEW_LEN): string {
  if (body.length <= max) return body;
  return `${body.slice(0, max).trimEnd()}…`;
}

type ProgramCommentsTableProps = {
  rows: AdminProgramCommentRow[];
  busyId: string | null;
  onDelete: (row: AdminProgramCommentRow) => Promise<boolean>;
  onToggleSpammer: (row: AdminProgramCommentRow, markSpammer: boolean) => Promise<boolean>;
};

export default function ProgramCommentsTable({
  rows,
  busyId,
  onDelete,
  onToggleSpammer
}: ProgramCommentsTableProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "comments" | "replies" | "spam">("all");
  const [sortColumn, setSortColumn] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [detailsRow, setDetailsRow] = useState<AdminProgramCommentRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProgramCommentRow | null>(null);
  const pageSize = 25;

  async function confirmDelete() {
    if (!deleteTarget) return;
    const ok = await onDelete(deleteTarget);
    if (ok) {
      if (detailsRow?.id === deleteTarget.id) setDetailsRow(null);
      setDeleteTarget(null);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      const isSpam = r.visitor?.isSpammer ?? r.visitorIsSpammer;
      if (filter === "spam" && !isSpam) return false;
      if (filter === "comments" && r.isReply) return false;
      if (filter === "replies" && !r.isReply) return false;
      if (!q) return true;
      return (
        r.authorName.toLowerCase().includes(q) ||
        r.body.toLowerCase().includes(q) ||
        r.programTitle.toLowerCase().includes(q) ||
        r.programSlug.toLowerCase().includes(q) ||
        (r.ipHash?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [rows, search, filter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case "program":
          cmp = a.programTitle.localeCompare(b.programTitle);
          break;
        case "author":
          cmp = a.authorName.localeCompare(b.authorName);
          break;
        case "createdAt":
        default:
          cmp =
            new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return list;
  }, [filtered, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);

  const parentByKey = useMemo(() => {
    const map = new Map<string, AdminProgramCommentRow>();
    for (const r of rows) {
      if (!r.isReply) map.set(`${r.programId}:${r.commentKey}`, r);
    }
    return map;
  }, [rows]);

  const repliesByParent = useMemo(() => {
    const map = new Map<string, AdminProgramCommentRow[]>();
    for (const r of rows) {
      if (!r.isReply || !r.parentCommentKey) continue;
      const key = `${r.programId}:${r.parentCommentKey}`;
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
      );
    }
    return map;
  }, [rows]);

  function handleSort(column: string) {
    if (sortColumn === column) {
      setSortDirection(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  }

  function SortTh({ label, column }: { label: string; column: string }) {
    const active = sortColumn === column;
    return (
      <th className="px-4 py-3 text-left font-medium text-gray-600">
        <button
          type="button"
          onClick={() => handleSort(column)}
          className="inline-flex cursor-pointer items-center gap-1 hover:text-gray-900">
          {label}
          <FaChevronDown
            className={`h-3 w-3 transition-transform ${active ? (sortDirection === "asc" ? "rotate-180" : "") : "opacity-30"}`}
          />
        </button>
      </th>
    );
  }

  const detailsParent = detailsRow?.isReply && detailsRow.parentCommentKey
    ? parentByKey.get(`${detailsRow.programId}:${detailsRow.parentCommentKey}`)
    : undefined;

  const detailsReplies =
    detailsRow && !detailsRow.isReply
      ? (repliesByParent.get(`${detailsRow.programId}:${detailsRow.commentKey}`) ?? [])
      : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search comments…" />
        <select
          value={filter}
          onChange={e => {
            setFilter(e.target.value as typeof filter);
            setPage(1);
          }}
          className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800">
          <option value="all">All</option>
          <option value="comments">Comments only</option>
          <option value="replies">Replies only</option>
          <option value="spam">Spammer visitors</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <SortTh label="Program" column="program" />
              <th className="px-4 py-3 text-left font-medium text-gray-600">Comment</th>
              <SortTh label="Author" column="author" />
              <th className="px-4 py-3 text-left font-medium text-gray-600">Visitor</th>
              <SortTh label="Date" column="createdAt" />
              <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  No comments match your filters.
                </td>
              </tr>
            ) : (
              pageRows.map(row => {
                const busy = busyId === row.id;
                const tier = row.visitor?.visitTier ?? row.visitorVisitTier ?? "new";
                const isSpam = row.visitor?.isSpammer ?? row.visitorIsSpammer;
                const replyCount = row.isReply
                  ? 0
                  : (repliesByParent.get(`${row.programId}:${row.commentKey}`)?.length ?? 0);
                return (
                  <tr key={row.id} className={row.isReply ? "bg-gray-50/80" : undefined}>
                    <td className="px-4 py-3 align-top">
                      <Link
                        href={`/program/${row.programSlug}`}
                        target="_blank"
                        className="cursor-pointer font-medium text-blue-700 hover:underline">
                        {row.programTitle}
                      </Link>
                      {row.isReply ? (
                        <div className="mt-1 text-xs text-gray-500">↳ reply</div>
                      ) : row.isPinned ? (
                        <div className="mt-1 text-xs text-amber-700">pinned</div>
                      ) : replyCount > 0 ? (
                        <div className="mt-1 text-xs text-gray-500">{replyCount} repl{replyCount === 1 ? "y" : "ies"}</div>
                      ) : null}
                    </td>
                    <td className="max-w-xs px-4 py-3 align-top">
                      <p className="text-gray-800">{truncateBody(row.body)}</p>
                      {row.body.length > PREVIEW_LEN ? (
                        <button
                          type="button"
                          onClick={() => setDetailsRow(row)}
                          className="mt-1 cursor-pointer text-xs font-semibold text-blue-700 hover:underline">
                          View full
                        </button>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 align-top text-gray-800">{row.authorName}</td>
                    <td className="px-4 py-3 align-top">
                      {row.ipHash ? (
                        <div className="flex w-fit flex-col gap-1">
                          <span className={`w-fit ${visitorTierBadgeClasses(tier, false)}`}>{tier}</span>
                          {isSpam ? (
                            <span className={`w-fit ${visitorTierBadgeClasses("new", true)}`}>spammer</span>
                          ) : null}
                          <span className="font-mono text-[10px] text-gray-400" title={row.ipHash}>
                            {row.ipHash.slice(0, 10)}…
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap text-gray-600">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleString(undefined, {
                            dateStyle: "short",
                            timeStyle: "short"
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailsRow(row)}
                            className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                            Details
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setDeleteTarget(row)}
                            title={`Delete ${row.isReply ? "reply" : "comment"}`}
                            aria-label={`Delete ${row.isReply ? "reply" : "comment"}`}
                            className="cursor-pointer rounded-md border border-gray-300 bg-white p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
                            <FaTrash className="h-4 w-4" />
                          </button>
                        </div>
                        {row.ipHash ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onToggleSpammer(row, !isSpam)}
                            className="cursor-pointer rounded border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
                            {busy ? "…" : isSpam ? "Unmark spammer" : "Mark spammer"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={sorted.length}
        itemsPerPage={pageSize}
        onPageChange={setPage}
        tone="dark"
      />

      {detailsRow ? (
        <ProgramCommentDetailsModal
          row={detailsRow}
          threadReplies={detailsReplies}
          parentComment={detailsParent}
          busyId={busyId}
          onClose={() => setDetailsRow(null)}
          onRequestDelete={row => setDeleteTarget(row)}
          onToggleSpammer={onToggleSpammer}
        />
      ) : null}

      <DeleteCommentConfirmModal
        row={deleteTarget}
        busy={deleteTarget ? busyId === deleteTarget.id : false}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
