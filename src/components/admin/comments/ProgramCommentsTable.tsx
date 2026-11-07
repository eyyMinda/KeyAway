"use client";

/**
 * @fileoverview Comment threads: a comment with its replies, newest activity first. A new reply moves its thread to
 * the top with a "new" count (read marks live in this browser). Any comment or reply can be answered inline.
 */
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { FaReply, FaTrash, FaUserShield } from "react-icons/fa";
import AnalyticsCard from "@/src/components/admin/AnalyticsCard";
import DeleteCommentConfirmModal from "@/src/components/admin/comments/DeleteCommentConfirmModal";
import ProgramCommentDetailsModal from "@/src/components/admin/comments/ProgramCommentDetailsModal";
import {
  AdminFilterBar,
  AdminListCard,
  AdminPagination,
  AdminSearch,
  AdminSelect,
  Chip,
  RelativeDate,
  programOptions,
  usePagedList
} from "@/src/components/admin/list/AdminListKit";
import { MAX_COMMENT_BODY } from "@/src/lib/program/commentBody";
import { STAFF_COMMENT_AUTHOR_NAME, STAFF_COMMENT_AUTHOR_ROLE } from "@/src/lib/program/staffCommentIdentity";
import { visitorTierBadgeClasses } from "@/src/theme/colorSchema";
import type { AdminProgramCommentRow as Row } from "@/src/types/admin/programComments";

type ProgramCommentsTableProps = {
  rows: Row[];
  busyId: string | null;
  onDelete: (row: Row) => Promise<boolean>;
  /** Posts a staff reply in the thread of `parent`; resolves once the list has the new reply. */
  onReply: (parent: Row, body: string) => Promise<void>;
  onSpammerChanged?: () => void | Promise<void>;
};

type Thread = {
  id: string;
  comment: Row;
  replies: Row[];
  lastActivity: number;
  /** The last word is not ours: a visitor commented or replied after the team. */
  awaiting: boolean;
  hasSpam: boolean;
};

type StatusFilter = "all" | "new" | "awaiting" | "pinned" | "spam";
type SortKey = "activity" | "newest" | "oldest" | "program";

/** Replies hidden behind "show earlier" once a thread has more than this many. */
const VISIBLE_REPLIES = 3;
const SEEN_STORAGE_KEY = "keyaway:admin-comments-seen";

type SeenState = { since: number; threads: Record<string, number> };

const time = (iso?: string) => (iso ? new Date(iso).getTime() : 0);
const isSpam = (r: Row) => Boolean(r.visitor?.isSpammer ?? r.visitorIsSpammer);
const isStaff = (r: Row) => r.authorName === STAFF_COMMENT_AUTHOR_NAME && r.authorRole === STAFF_COMMENT_AUTHOR_ROLE;

/** First visit: everything counts as read, so only activity after today shows up as new. */
function readSeen(): SeenState {
  const fresh = { since: Date.now(), threads: {} };
  try {
    const parsed = JSON.parse(localStorage.getItem(SEEN_STORAGE_KEY) ?? "null") as SeenState | null;
    if (parsed && typeof parsed.since === "number" && parsed.threads) return parsed;
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(fresh));
  } catch {
    // Storage blocked: new counts reset on every visit.
  }
  return fresh;
}

function writeSeen(state: SeenState) {
  try {
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage blocked; the in-memory state still works for this visit.
  }
}

function buildThreads(rows: Row[]): Thread[] {
  const byId = new Map<string, Thread>();
  for (const row of rows) {
    if (row.isReply) continue;
    byId.set(`${row.programId}:${row.commentKey}`, {
      id: row.id,
      comment: row,
      replies: [],
      lastActivity: time(row.createdAt),
      awaiting: false,
      hasSpam: false
    });
  }
  for (const row of rows) {
    if (!row.isReply || !row.parentCommentKey) continue;
    byId.get(`${row.programId}:${row.parentCommentKey}`)?.replies.push(row);
  }
  for (const thread of byId.values()) {
    thread.replies.sort((a, b) => time(a.createdAt) - time(b.createdAt));
    const items = [thread.comment, ...thread.replies];
    thread.lastActivity = Math.max(...items.map(r => time(r.createdAt)));
    thread.awaiting = !isStaff(items[items.length - 1]);
    thread.hasSpam = items.some(isSpam);
  }
  return [...byId.values()];
}

function Avatar({ row }: { row: Row }) {
  if (isStaff(row)) {
    return (
      <span
        aria-hidden
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white dark:bg-primary-500">
        <FaUserShield className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold uppercase text-gray-600 dark:bg-gray-800 dark:text-gray-300">
      {row.authorName.trim().charAt(0) || "?"}
    </span>
  );
}

const actionButton =
  "inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100";

function CommentItem({
  row,
  unread,
  busy,
  onReply,
  onDetails,
  onDelete
}: {
  row: Row;
  unread: boolean;
  busy: boolean;
  onReply: () => void;
  onDetails: () => void;
  onDelete: () => void;
}) {
  const staff = isStaff(row);
  const tier = row.visitor?.visitTier ?? row.visitorVisitTier ?? "new";
  return (
    <div className="flex gap-3">
      <Avatar row={row} />
      <div
        className={`min-w-0 flex-1 rounded-xl border px-3.5 py-2.5 ${
          unread
            ? "border-sky-300 bg-sky-50/60 dark:border-sky-500/40 dark:bg-sky-500/5"
            : staff
              ? "border-primary-200 bg-primary-50/40 dark:border-primary-500/30 dark:bg-primary-500/5"
              : "border-gray-200 dark:border-gray-800"
        }`}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="max-w-48 truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
            {row.authorName}
          </span>
          {staff ? (
            <Chip tone="blue">Team</Chip>
          ) : row.ipHash ? (
            <span className={visitorTierBadgeClasses(tier, false)}>{tier}</span>
          ) : null}
          {isSpam(row) && <span className={visitorTierBadgeClasses("new", true)}>spammer</span>}
          {unread && <Chip tone="blue">New</Chip>}
          <span className="text-gray-500 dark:text-gray-400">
            <RelativeDate iso={row.createdAt} />
          </span>
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800 dark:text-gray-200">
          {row.body}
        </p>
        <div className="-ml-1.5 mt-1.5 flex flex-wrap items-center gap-1">
          <button type="button" onClick={onReply} className={actionButton}>
            <FaReply className="h-3 w-3" /> Reply
          </button>
          {!staff && (
            <button type="button" onClick={onDetails} className={actionButton}>
              Visitor
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            aria-label={`Delete ${row.isReply ? "reply" : "comment"}`}
            className={`${actionButton} hover:text-red-600 dark:hover:text-red-400`}>
            <FaTrash className="h-3 w-3" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function ReplyComposer({
  target,
  onSubmit,
  onCancel
}: {
  target: Row;
  onSubmit: (body: string) => Promise<void>;
  onCancel: () => void;
}) {
  // Replies are one level deep, so answering a reply mentions its author in the same thread.
  const [body, setBody] = useState(target.isReply && !isStaff(target) ? `@${target.authorName} ` : "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const text = body.trim();

  const submit = async () => {
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSubmit(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post the reply");
      setSending(false);
    }
  };

  return (
    <div className="ml-11 rounded-xl border border-gray-300 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-900">
      <p className="mb-1.5 text-xs text-gray-500 dark:text-gray-400">
        Replying to <span className="font-medium text-gray-700 dark:text-gray-200">{target.authorName}</span> as{" "}
        {STAFF_COMMENT_AUTHOR_NAME} · {STAFF_COMMENT_AUTHOR_ROLE}
      </p>
      <textarea
        autoFocus
        value={body}
        rows={3}
        maxLength={MAX_COMMENT_BODY}
        onChange={e => setBody(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void submit();
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Write a reply… (Ctrl+Enter to post)"
        className="w-full resize-y rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:text-gray-100"
      />
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      <div className="mt-2 flex items-center justify-end gap-2">
        <span className="mr-auto text-[11px] tabular-nums text-gray-400">
          {body.length}/{MAX_COMMENT_BODY}
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
          Cancel
        </button>
        <button
          type="button"
          disabled={!text || sending}
          onClick={() => void submit()}
          className="cursor-pointer rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50">
          {sending ? "Posting…" : "Post reply"}
        </button>
      </div>
    </div>
  );
}

function ThreadCard({
  thread,
  seenAt,
  busyId,
  replyTarget,
  onStartReply,
  onCancelReply,
  onSubmitReply,
  onMarkRead,
  onDetails,
  onDelete
}: {
  thread: Thread;
  seenAt: number;
  busyId: string | null;
  replyTarget: Row | null;
  onStartReply: (row: Row) => void;
  onCancelReply: () => void;
  onSubmitReply: (body: string) => Promise<void>;
  onMarkRead: () => void;
  onDetails: (row: Row) => void;
  onDelete: (row: Row) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const { comment, replies } = thread;
  const isUnread = (row: Row) => !isStaff(row) && time(row.createdAt) > seenAt;
  const newCount = [comment, ...replies].filter(isUnread).length;
  const hidden = showAll || replies.length <= VISIBLE_REPLIES ? 0 : replies.length - VISIBLE_REPLIES;
  const item = (row: Row) => (
    <CommentItem
      key={row.id}
      row={row}
      unread={isUnread(row)}
      busy={busyId === row.id}
      onReply={() => onStartReply(row)}
      onDetails={() => onDetails(row)}
      onDelete={() => onDelete(row)}
    />
  );

  return (
    <li className="px-4 py-4 sm:px-5">
      <div className="mb-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <Link
          href={`/program/${comment.programSlug}`}
          target="_blank"
          className="max-w-72 truncate font-semibold text-gray-700 hover:underline dark:text-gray-200">
          {comment.programTitle}
        </Link>
        {comment.isPinned && <Chip tone="amber">Pinned</Chip>}
        {thread.awaiting && <Chip tone="red">Awaiting reply</Chip>}
        {newCount > 0 && (
          <button
            type="button"
            onClick={onMarkRead}
            title="Mark as read"
            className="cursor-pointer rounded-full bg-sky-600 px-2 text-[11px] font-semibold leading-5 text-white hover:bg-sky-700">
            {newCount} new · mark read
          </button>
        )}
        <span className="ml-auto text-gray-500 dark:text-gray-400">
          {replies.length} {replies.length === 1 ? "reply" : "replies"} · active{" "}
          <RelativeDate iso={new Date(thread.lastActivity).toISOString()} />
        </span>
      </div>

      <div className="space-y-2.5">
        {item(comment)}
        {replies.length > 0 && (
          <div className="ml-4 space-y-2.5 border-l-2 border-gray-200 pl-4 dark:border-gray-800 sm:ml-11">
            {hidden > 0 && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="cursor-pointer text-xs font-medium text-sky-700 hover:underline dark:text-sky-300">
                Show {hidden} earlier {hidden === 1 ? "reply" : "replies"}
              </button>
            )}
            {replies.slice(hidden).map(item)}
          </div>
        )}
        {replyTarget && (
          <ReplyComposer key={replyTarget.id} target={replyTarget} onSubmit={onSubmitReply} onCancel={onCancelReply} />
        )}
      </div>
    </li>
  );
}

export default function ProgramCommentsTable({
  rows,
  busyId,
  onDelete,
  onReply,
  onSpammerChanged
}: ProgramCommentsTableProps) {
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("activity");
  const [detailsRow, setDetailsRow] = useState<Row | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [reply, setReply] = useState<{ threadId: string; target: Row } | null>(null);
  const [seen, setSeen] = useState<SeenState>(readSeen);

  const threads = useMemo(() => buildThreads(rows), [rows]);
  const seenAt = useCallback((thread: Thread) => seen.threads[thread.id] ?? seen.since, [seen]);
  const newCountOf = useCallback(
    (thread: Thread) =>
      [thread.comment, ...thread.replies].filter(r => !isStaff(r) && time(r.createdAt) > seenAt(thread)).length,
    [seenAt]
  );

  const markRead = useCallback((ids: string[]) => {
    setSeen(prev => {
      const now = Date.now();
      const next = { ...prev, threads: { ...prev.threads, ...Object.fromEntries(ids.map(id => [id, now])) } };
      writeSeen(next);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = threads.filter(t => {
      if (program !== "all" && t.comment.programSlug !== program) return false;
      if (status === "new" && newCountOf(t) === 0) return false;
      if (status === "awaiting" && !t.awaiting) return false;
      if (status === "pinned" && !t.comment.isPinned) return false;
      if (status === "spam" && !t.hasSpam) return false;
      if (!q) return true;
      return [t.comment, ...t.replies].some(r =>
        [r.authorName, r.body, r.programTitle, r.programSlug, r.ipHash].some(v => v?.toLowerCase().includes(q))
      );
    });
    return list.sort((a, b) => {
      if (sort === "program") return a.comment.programTitle.localeCompare(b.comment.programTitle);
      if (sort === "activity") return b.lastActivity - a.lastActivity;
      const diff = time(a.comment.createdAt) - time(b.comment.createdAt);
      return sort === "oldest" ? diff : -diff;
    });
  }, [threads, search, program, status, sort, newCountOf]);

  const paged = usePagedList(filtered, `${search}|${program}|${status}|${sort}`, 15);

  const unreadThreads = threads.filter(t => newCountOf(t) > 0);
  const awaitingCount = threads.filter(t => t.awaiting).length;
  const spamCount = threads.filter(t => t.hasSpam).length;
  const replyTotal = rows.filter(r => r.isReply).length;

  const detailsThread = detailsRow
    ? threads.find(
        t =>
          t.comment.programId === detailsRow.programId &&
          t.comment.commentKey === (detailsRow.parentCommentKey ?? detailsRow.commentKey)
      )
    : undefined;

  async function confirmDelete() {
    if (!deleteTarget) return;
    const ok = await onDelete(deleteTarget);
    if (ok) {
      if (detailsRow?.id === deleteTarget.id) setDetailsRow(null);
      setDeleteTarget(null);
    }
  }

  async function submitReply(thread: Thread, body: string) {
    await onReply(thread.comment, body);
    setReply(null);
    markRead([thread.id]);
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <AnalyticsCard label="Threads" value={threads.length} />
        <AnalyticsCard label="Replies" value={replyTotal} />
        <AnalyticsCard label="Awaiting reply" value={awaitingCount} />
        <AnalyticsCard label="New since last read" value={unreadThreads.length} />
      </div>

      <AdminFilterBar>
        <AdminSearch
          value={search}
          onChange={setSearch}
          placeholder="Search comment, author, program or visitor id…"
          className="sm:min-w-64 sm:flex-1"
        />
        <AdminSelect
          label="Program"
          value={program}
          onChange={setProgram}
          options={programOptions(threads.map(t => ({ key: t.comment.programSlug, label: t.comment.programTitle })))}
          className="sm:max-w-64"
        />
        <AdminSelect
          label="Status"
          value={status}
          onChange={v => setStatus(v as StatusFilter)}
          options={[
            { value: "all", label: "All threads", count: threads.length },
            { value: "new", label: "New", count: unreadThreads.length },
            { value: "awaiting", label: "Awaiting reply", count: awaitingCount },
            { value: "pinned", label: "Pinned", count: threads.filter(t => t.comment.isPinned).length },
            { value: "spam", label: "With spammers", count: spamCount }
          ]}
        />
        <AdminSelect
          label="Sort"
          value={sort}
          onChange={v => setSort(v as SortKey)}
          options={[
            { value: "activity", label: "Latest activity" },
            { value: "newest", label: "Newest comment" },
            { value: "oldest", label: "Oldest comment" },
            { value: "program", label: "Program A–Z" }
          ]}
        />
        {unreadThreads.length > 0 && (
          <button
            type="button"
            onClick={() => markRead(unreadThreads.map(t => t.id))}
            className="h-10 cursor-pointer rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
            Mark all read
          </button>
        )}
      </AdminFilterBar>

      <AdminListCard
        title="Threads"
        meta={`${filtered.length.toLocaleString()} ${filtered.length === 1 ? "thread" : "threads"}`}
        footer={
          filtered.length > 0 && (
            <AdminPagination
              page={paged.page}
              totalPages={paged.totalPages}
              total={filtered.length}
              pageSize={paged.pageSize}
              onPageChange={paged.setPage}
            />
          )
        }>
        {paged.pageItems.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            No threads match these filters.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {paged.pageItems.map(thread => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                seenAt={seenAt(thread)}
                busyId={busyId}
                replyTarget={reply?.threadId === thread.id ? reply.target : null}
                onStartReply={target => setReply({ threadId: thread.id, target })}
                onCancelReply={() => setReply(null)}
                onSubmitReply={body => submitReply(thread, body)}
                onMarkRead={() => markRead([thread.id])}
                onDetails={setDetailsRow}
                onDelete={setDeleteTarget}
              />
            ))}
          </ul>
        )}
      </AdminListCard>

      {detailsRow ? (
        <ProgramCommentDetailsModal
          row={detailsRow}
          threadReplies={detailsThread?.replies ?? []}
          parentComment={detailsRow.isReply ? detailsThread?.comment : undefined}
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
