"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import DeleteCommentConfirmModal from "@/src/components/admin/comments/DeleteCommentConfirmModal";
import AdminViewDetailsButton from "@/src/components/admin/AdminViewDetailsButton";
import ProgramCommentDetailsModal from "@/src/components/admin/comments/ProgramCommentDetailsModal";
import { FaTrash } from "react-icons/fa";
import {
  AdminEmptyRows,
  AdminFilterBar,
  AdminListCard,
  AdminPagination,
  AdminSearch,
  AdminSelect,
  Chip,
  RelativeDate,
  adminRow,
  adminTd,
  adminTh,
  adminTheadRow,
  programOptions,
  usePagedList
} from "@/src/components/admin/list/AdminListKit";
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
  onSpammerChanged?: () => void | Promise<void>;
};

type TypeFilter = "all" | "comments" | "replies" | "pinned";
type VisitorFilter = "all" | "spam" | "clean";
type SortKey = "newest" | "oldest" | "program";

const isSpam = (r: AdminProgramCommentRow) => Boolean(r.visitor?.isSpammer ?? r.visitorIsSpammer);

export default function ProgramCommentsTable({ rows, busyId, onDelete, onSpammerChanged }: ProgramCommentsTableProps) {
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("all");
  const [type, setType] = useState<TypeFilter>("all");
  const [visitor, setVisitor] = useState<VisitorFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [detailsRow, setDetailsRow] = useState<AdminProgramCommentRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProgramCommentRow | null>(null);

  async function confirmDelete() {
    if (!deleteTarget) return;
    const ok = await onDelete(deleteTarget);
    if (ok) {
      if (detailsRow?.id === deleteTarget.id) setDetailsRow(null);
      setDeleteTarget(null);
    }
  }

  const sorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter(r => {
      if (program !== "all" && r.programSlug !== program) return false;
      if (type === "comments" && r.isReply) return false;
      if (type === "replies" && !r.isReply) return false;
      if (type === "pinned" && !r.isPinned) return false;
      if (visitor === "spam" && !isSpam(r)) return false;
      if (visitor === "clean" && isSpam(r)) return false;
      if (!q) return true;
      return [r.authorName, r.body, r.programTitle, r.programSlug, r.ipHash].some(v => v?.toLowerCase().includes(q));
    });
    return list.sort((a, b) => {
      if (sort === "program") return a.programTitle.localeCompare(b.programTitle);
      const diff = new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
      return sort === "oldest" ? diff : -diff;
    });
  }, [rows, search, program, type, visitor, sort]);

  const paged = usePagedList(sorted, `${search}|${program}|${type}|${visitor}|${sort}`);

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
      list.sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());
    }
    return map;
  }, [rows]);

  const detailsParent =
    detailsRow?.isReply && detailsRow.parentCommentKey
      ? parentByKey.get(`${detailsRow.programId}:${detailsRow.parentCommentKey}`)
      : undefined;

  const detailsReplies =
    detailsRow && !detailsRow.isReply
      ? (repliesByParent.get(`${detailsRow.programId}:${detailsRow.commentKey}`) ?? [])
      : [];

  const spamCount = rows.filter(isSpam).length;

  return (
    <div>
      <AdminFilterBar>
        <AdminSearch
          value={search}
          onChange={setSearch}
          placeholder="Search comment, author, program or visitor id…"
          className="sm:flex-1 sm:min-w-64"
        />
        <AdminSelect
          label="Program"
          value={program}
          onChange={setProgram}
          options={programOptions(rows.map(r => ({ key: r.programSlug, label: r.programTitle })))}
          className="sm:max-w-64"
        />
        <AdminSelect
          label="Type"
          value={type}
          onChange={v => setType(v as TypeFilter)}
          options={[
            { value: "all", label: "All types", count: rows.length },
            { value: "comments", label: "Comments", count: rows.filter(r => !r.isReply).length },
            { value: "replies", label: "Replies", count: rows.filter(r => r.isReply).length },
            { value: "pinned", label: "Pinned", count: rows.filter(r => r.isPinned).length }
          ]}
        />
        <AdminSelect
          label="Visitor"
          value={visitor}
          onChange={v => setVisitor(v as VisitorFilter)}
          options={[
            { value: "all", label: "All visitors" },
            { value: "clean", label: "Not flagged", count: rows.length - spamCount },
            { value: "spam", label: "Spammers", count: spamCount }
          ]}
        />
        <AdminSelect
          label="Sort"
          value={sort}
          onChange={v => setSort(v as SortKey)}
          options={[
            { value: "newest", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
            { value: "program", label: "Program A–Z" }
          ]}
        />
      </AdminFilterBar>

      <AdminListCard
        title="Comments"
        meta={`${sorted.length.toLocaleString()} ${sorted.length === 1 ? "result" : "results"}`}
        footer={
          sorted.length > 0 && (
            <AdminPagination
              page={paged.page}
              totalPages={paged.totalPages}
              total={sorted.length}
              pageSize={paged.pageSize}
              onPageChange={paged.setPage}
            />
          )
        }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={adminTheadRow}>
              <tr>
                <th className={adminTh}>Comment</th>
                <th className={`${adminTh} hidden md:table-cell`}>Program</th>
                <th className={adminTh}>Author</th>
                <th className={adminTh}>Posted</th>
                <th className={adminTh} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paged.pageItems.length === 0 ? (
                <AdminEmptyRows colSpan={5}>No comments match these filters.</AdminEmptyRows>
              ) : (
                paged.pageItems.map(row => {
                  const busy = busyId === row.id;
                  const tier = row.visitor?.visitTier ?? row.visitorVisitTier ?? "new";
                  const replyCount = row.isReply
                    ? 0
                    : (repliesByParent.get(`${row.programId}:${row.commentKey}`)?.length ?? 0);
                  return (
                    <tr key={row.id} className={adminRow}>
                      <td className={`${adminTd} max-w-lg`}>
                        {(row.isReply || row.isPinned || replyCount > 0) && (
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            {row.isReply && <Chip tone="gray">↳ Reply</Chip>}
                            {row.isPinned && <Chip tone="amber">Pinned</Chip>}
                            {replyCount > 0 && (
                              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                {replyCount} repl{replyCount === 1 ? "y" : "ies"}
                              </span>
                            )}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setDetailsRow(row)}
                          title="Open thread"
                          className="text-left text-gray-800 dark:text-gray-200 line-clamp-2 cursor-pointer hover:text-gray-950 dark:hover:text-white">
                          {truncateBody(row.body, 240)}
                        </button>
                        <Link
                          href={`/program/${row.programSlug}`}
                          target="_blank"
                          className="md:hidden mt-1 block text-xs text-primary-600 dark:text-sky-400 hover:underline">
                          {row.programTitle}
                        </Link>
                      </td>
                      <td className={`${adminTd} hidden md:table-cell max-w-48`}>
                        <Link
                          href={`/program/${row.programSlug}`}
                          target="_blank"
                          className="font-medium text-gray-900 dark:text-gray-100 hover:text-primary-700 dark:hover:text-sky-300 hover:underline truncate block">
                          {row.programTitle}
                        </Link>
                      </td>
                      <td className={adminTd}>
                        <div className="text-gray-900 dark:text-gray-100 truncate max-w-40">{row.authorName}</div>
                        {row.ipHash ? (
                          <div className="mt-1 flex flex-wrap items-center gap-1" title={row.ipHash}>
                            <span className={visitorTierBadgeClasses(tier, false)}>{tier}</span>
                            {isSpam(row) && <span className={visitorTierBadgeClasses("new", true)}>spammer</span>}
                          </div>
                        ) : null}
                      </td>
                      <td className={`${adminTd} text-xs text-gray-500 dark:text-gray-400`}>
                        <RelativeDate iso={row.createdAt} />
                      </td>
                      <td className={`${adminTd} text-right`}>
                        <div className="inline-flex items-center gap-1.5">
                          <AdminViewDetailsButton onClick={() => setDetailsRow(row)} />
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setDeleteTarget(row)}
                            title={`Delete ${row.isReply ? "reply" : "comment"}`}
                            aria-label={`Delete ${row.isReply ? "reply" : "comment"}`}
                            className="cursor-pointer rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50">
                            <FaTrash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </AdminListCard>

      {detailsRow ? (
        <ProgramCommentDetailsModal
          row={detailsRow}
          threadReplies={detailsReplies}
          parentComment={detailsParent}
          busyId={busyId}
          onClose={() => setDetailsRow(null)}
          onRequestDelete={row => setDeleteTarget(row)}
          onSpammerChanged={onSpammerChanged}
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
