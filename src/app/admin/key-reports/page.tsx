"use client";

/** @fileoverview Admin key reports: keys ranked by what their reports say, bulk status edits, per-report details. */
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FaArrowsRotate } from "react-icons/fa6";
import { client } from "@/src/sanity/lib/client";
import { adminKeyReportProgramsQuery } from "@/src/lib/sanity/queries";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import KeyReportDetailsModal from "@/src/components/admin/key-reports/KeyReportDetailsModal";
import KeyReportsTable from "@/src/components/admin/key-reports/KeyReportsTable";
import {
  buildKeyReports,
  keyReportId,
  keyQueryMatchesReport,
  patchReportRows,
  type KeyReportProgram,
  type KeyReportRowUpdate
} from "@/src/lib/admin/keyReportGroups";
import { normalizeProgramFlow } from "@/src/lib/program/activationEntry";
import type { KeyReport, KeyReportEvent } from "@/src/types";
import type { CDKeyStatus } from "@/src/types/program";

const TITLE = "Key Reports";
const SUBTITLE = "What visitors say about each key, and what to do about it";

async function sendPatch(url: string, body: unknown): Promise<KeyReportRowUpdate[]> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body)
  });
  const json = (await res.json().catch(() => null)) as { data?: unknown; error?: { message?: string } } | null;
  if (!res.ok) throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  return Array.isArray(json?.data) ? (json.data as KeyReportRowUpdate[]) : [];
}

function KeyReportsPageContent() {
  const searchParams = useSearchParams();
  const [reports, setReports] = useState<KeyReport[]>([]);
  const [programs, setPrograms] = useState<KeyReportProgram[]>([]);
  const [loadedAt, setLoadedAt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const [programData, res] = await Promise.all([
      client.fetch<KeyReportProgram[]>(adminKeyReportProgramsQuery),
      fetch("/api/v1/admin/key-reports")
    ]);
    if (!res.ok) throw new Error(`Could not load reports (${res.status})`);
    const events = ((await res.json()) as { data?: Array<Record<string, unknown>> }).data ?? [];
    setPrograms(programData);
    setReports(buildKeyReports(events, programData));
    setLoadedAt(Date.now());
  }, []);

  useEffect(() => {
    let cancelled = false;
    load()
      .catch(e => !cancelled && setError(e instanceof Error ? e.message : "Could not load reports"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load reports");
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const setKeyStatus = useCallback(async (targets: KeyReport[], status: CDKeyStatus) => {
    const editable = targets.filter(r => r.keyId && r.status !== status);
    if (!editable.length) return;
    const ids = new Set(editable.map(keyReportId));
    setError(null);
    setSavingKeys(prev => new Set([...prev, ...ids]));
    try {
      await sendPatch("/api/v1/admin/key-reports", {
        updates: editable.map(r => ({ programSlug: r.programSlug, keyId: r.keyId, newStatus: status }))
      });
      setReports(prev => prev.map(r => (ids.has(keyReportId(r)) ? { ...r, status } : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the key status");
    } finally {
      setSavingKeys(prev => new Set([...prev].filter(id => !ids.has(id))));
    }
  }, []);

  /** Applies only what the server changed to the one key, so nothing else reloads or moves. */
  const applyRowUpdates = useCallback((id: string, updates: KeyReportRowUpdate[]) => {
    if (updates.length) setReports(prev => prev.map(r => (keyReportId(r) === id ? patchReportRows(r, updates) : r)));
  }, []);

  const setReportEvents = useCallback(
    async (id: string, reportIds: string[], eventType: KeyReportEvent) => {
      applyRowUpdates(id, await sendPatch("/api/v1/admin/key-report-event", { reportIds, eventType }));
    },
    [applyRowUpdates]
  );

  const setTriedVersion = useCallback(
    async (id: string, reportId: string, triedVersion: string) => {
      applyRowUpdates(id, await sendPatch("/api/v1/admin/key-report-event", { reportId, triedVersion }));
    },
    [applyRowUpdates]
  );

  const requestedProgram = useMemo(() => {
    const slug = searchParams.get("program");
    return slug && programs.some(p => p.slug?.current === slug) ? slug : "all";
  }, [programs, searchParams]);

  const keyParam = searchParams.get("key");
  const scoped = useMemo(() => {
    if (!keyParam) return reports;
    const flowBySlug = new Map(programs.map(p => [p.slug?.current, normalizeProgramFlow(p.programFlow)]));
    return reports.filter(r => keyQueryMatchesReport(flowBySlug.get(r.programSlug) ?? "cd_key", r, keyParam));
  }, [keyParam, programs, reports]);

  const openReport = openId ? (reports.find(r => keyReportId(r) === openId) ?? null) : null;

  return (
    <ProtectedAdminLayout title={TITLE} subtitle={SUBTITLE}>
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="min-w-0 text-sm text-red-700 dark:text-red-300" role={error ? "alert" : undefined}>
              {error}
            </p>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={refreshing}
              title="Refresh"
              aria-label="Refresh"
              className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
              <FaArrowsRotate className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
          <KeyReportsTable
            reports={scoped}
            initialProgram={requestedProgram}
            loadedAt={loadedAt}
            savingKeys={savingKeys}
            onSetStatus={setKeyStatus}
            onOpen={report => setOpenId(keyReportId(report))}
          />
        </>
      )}

      {openReport ? (
        <KeyReportDetailsModal
          key={openId}
          report={openReport}
          savingStatus={savingKeys.has(keyReportId(openReport))}
          onClose={() => setOpenId(null)}
          onSetStatus={status => void setKeyStatus([openReport], status)}
          onSetEvents={setReportEvents}
          onSetTriedVersion={setTriedVersion}
        />
      ) : null}
    </ProtectedAdminLayout>
  );
}

export default function KeyReportsPage() {
  return (
    <Suspense fallback={<ProtectedAdminLayout title={TITLE} subtitle={SUBTITLE}>{null}</ProtectedAdminLayout>}>
      <KeyReportsPageContent />
    </Suspense>
  );
}
