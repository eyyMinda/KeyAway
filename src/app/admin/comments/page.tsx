"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import ProgramCommentsTable from "@/src/components/admin/comments/ProgramCommentsTable";
import type { AdminProgramCommentRow } from "@/src/types/admin/programComments";

export default function AdminCommentsPage() {
  const [rows, setRows] = useState<AdminProgramCommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/admin/comments");
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        setRows(json.data as AdminProgramCommentRow[]);
      } else {
        console.error("comments fetch", json);
        setRows([]);
      }
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  async function handleDelete(row: AdminProgramCommentRow): Promise<boolean> {
    setBusyId(row.id);
    try {
      const res = await fetch("/api/v1/admin/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: row.programId,
          programSlug: row.programSlug,
          commentKey: row.commentKey,
          ...(row.parentCommentKey ? { parentCommentKey: row.parentCommentKey } : {})
        })
      });
      if (res.ok) {
        const isGone = (r: AdminProgramCommentRow) =>
          r.id === row.id || (!row.isReply && r.programId === row.programId && r.parentCommentKey === row.commentKey);
        setRows(prev => prev.filter(r => !isGone(r)));
        return true;
      }
      console.error(await res.text());
      return false;
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <ProtectedAdminLayout title="Comments" subtitle="Moderate program page comments">
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">Loading comments…</div>
      </ProtectedAdminLayout>
    );
  }

  return (
    <ProtectedAdminLayout
      title="Comments"
      subtitle={`${rows.length} comment${rows.length === 1 ? "" : "s"} across programs`}>
      <ProgramCommentsTable
        rows={rows}
        busyId={busyId}
        onDelete={handleDelete}
        onSpammerChanged={fetchRows}
      />
    </ProtectedAdminLayout>
  );
}
