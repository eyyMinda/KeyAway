"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import DeleteCommentConfirmModal from "@/src/components/admin/comments/DeleteCommentConfirmModal";
import ProgramCommentDetailsModal from "@/src/components/admin/comments/ProgramCommentDetailsModal";
import { FaTrash } from "react-icons/fa";
import AnalyticsCard from "@/src/components/admin/AnalyticsCard";
import {
  AdminFilterBar,
  AdminListCard,
  AdminPagination,
  AdminSearch,
  AdminSelect,
  Chip,
  RelativeDate,
  adminRow,
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
  const replyTotal = rows.filter(r => r.isReply).length;

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <AnalyticsCard label="Comments" value={rows.length - replyTotal} />
        <AnalyticsCard label="Replies" value={replyTotal} />
        <AnalyticsCard label="Pinned" value={rows.filter(r => r.isPinned).length} />
        <AnalyticsCard label="From flagged visitors" value={spamCount} />
      </div>

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
        {paged.pageItems.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">No comments match these filters.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {paged.pageItems.map(row => {
              const busy = busyId === row.id;
              const tier = row.visitor?.visitTier ?? row.visitorVisitTier ?? "new";
              const replyCount = row.isReply ? 0 : (repliesByParent.get(`${row.programId}:${row.commentKey}`)?.length ?? 0);
              return (
                <li key={row.id} className={`${adminRow} flex gap-3 px-4 py-3 sm:px-5`}>
                  <span
                    aria-hidden
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold uppercase text-gray-600 dark:bg-gray-800 dark:text-gray-300 ${row.isReply ? "sm:ml-6" : ""}`}>
                    {row.authorName.trim().charAt(0) || "?"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                      <span className="max-w-48 truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{row.authorName}</span>
                      {row.ipHash ? <span className={visitorTierBadgeClasses(tier, false)}>{tier}</span> : null}
                      {isSpam(row) && <span className={visitorTierBadgeClasses("new", true)}>spammer</span>}
                      {row.isReply && <Chip tone="gray">Reply</Chip>}
                      {row.isPinned && <Chip tone="amber">Pinned</Chip>}
                      <span className="text-gray-400 dark:text-gray-500">·</span>
                      <Link
                        href={`/program/${row.programSlug}`}
                        target="_blank"
                        className="max-w-64 truncate text-gray-600 hover:underline dark:text-gray-300">
                        {row.programTitle}
                      </Link>
                      <span className="text-gray-400 dark:text-gray-500">·</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        <RelativeDate iso={row.createdAt} />
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDetailsRow(row)}
                      title="Open thread"
                      className="mt-1 block w-full cursor-pointer text-left text-sm leading-relaxed text-gray-700 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white">
                      <span className="line-clamp-2">{truncateBody(row.body, 240)}</span>
                    </button>
                    {replyCount > 0 && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {replyCount} {replyCount === 1 ? "reply" : "replies"}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-start gap-1">
                    <button
                      type="button"
                      onClick={() => setDetailsRow(row)}
                      className="cursor-pointer rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
                      Open
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setDeleteTarget(row)}
                      title={`Delete ${row.isReply ? "reply" : "comment"}`}
                      aria-label={`Delete ${row.isReply ? "reply" : "comment"}`}
                      className="cursor-pointer rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-500 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                      <FaTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
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
