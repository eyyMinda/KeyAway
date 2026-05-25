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
    setLoading(true);
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
        await fetchRows();
        return true;
      }
      console.error(await res.text());
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleSpammer(
    row: AdminProgramCommentRow,
    markSpammer: boolean
  ): Promise<boolean> {
    if (!row.ipHash) return false;
    const msg = markSpammer
      ? `Mark visitor ${row.ipHash.slice(0, 10)}… as spammer? They will not be able to post comments or negative key reports.`
      : `Unmark spammer for ${row.ipHash.slice(0, 10)}…?`;
    if (!confirm(msg)) return false;

    setBusyId(row.id);
    try {
      const res = await fetch("/api/v1/admin/visitor-spammer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorHash: row.ipHash, isSpammer: markSpammer })
      });
      if (res.ok) {
        await fetchRows();
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
        <div className="py-12 text-center text-gray-500">Loading comments…</div>
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
        onToggleSpammer={handleToggleSpammer}
      />
    </ProtectedAdminLayout>
  );
}
