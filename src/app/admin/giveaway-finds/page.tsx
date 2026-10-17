"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import AddEntryModal, { type AddEntryPreset } from "@/src/components/admin/giveaway-finds/AddEntryModal";
import GiveawayFindsTable, { type GiveawayFindUpdate } from "@/src/components/admin/giveaway-finds/GiveawayFindsTable";
import WatchPagesPanel from "@/src/components/admin/giveaway-finds/WatchPagesPanel";
import SearchInput from "@/src/components/ui/SearchInput";
import t from "@/src/locales/admin/giveaway-finds/en.json";
import { formatRelativeTimeCompact } from "@/src/lib/dateUtils";
import type {
  GiveawayDiscoverySummary,
  GiveawayFind,
  GiveawayFindStatus,
  GiveawaySourceOption,
  GiveawayWatchPageHealth
} from "@/src/types/giveaways";

type Payload = {
  finds: GiveawayFind[];
  sources: GiveawaySourceOption[];
  programs: { _id: string; title: string }[];
  watchPages: GiveawayWatchPageHealth[];
  lastRun: { status: string; source: string; details?: string; ranAt: string } | null;
};

async function loadFinds(): Promise<Payload | null> {
  try {
    const res = await fetch("/api/v1/admin/giveaway-finds");
    const json = await res.json();
    return res.ok && json?.data ? (json.data as Payload) : null;
  } catch (error) {
    console.error("Error fetching giveaway finds:", error);
    return null;
  }
}

const selectClass =
  "w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100";

export default function GiveawayFindsPage() {
  const [data, setData] = useState<Payload>({ finds: [], sources: [], programs: [], watchPages: [], lastRun: null });
  const [addTarget, setAddTarget] = useState<{ find: GiveawayFind; preset: AddEntryPreset } | null>(null);
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<GiveawayFindStatus | "all">("new");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [matchFilter, setMatchFilter] = useState<"all" | "matched" | "possible">("all");
  const [rememberNames, setRememberNames] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadFinds().then(payload => {
      if (cancelled) return;
      if (payload) setData(payload);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchFinds = async () => {
    const payload = await loadFinds();
    if (payload) setData(payload);
  };

  const handleUpdate = async (id: string, updates: GiveawayFindUpdate) => {
    setUpdatingId(id);
    setMessage(null);
    try {
      const body = updates.programId ? { ...updates, rememberAlias: rememberNames } : updates;
      const res = await fetch(`/api/v1/admin/giveaway-finds/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message ?? t.updateFailed);
      if (json?.data?.aliasAdded) setMessage({ text: t.aliasSaved.replace("{alias}", json.data.aliasAdded) });
      await fetchFinds();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : t.updateFailed, error: true });
    } finally {
      setUpdatingId(null);
    }
  };

  const watchFind = async (find: GiveawayFind) => {
    if (!find.program) return;
    setUpdatingId(find._id);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/admin/giveaway-watch-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId: find.program._id, url: find.sourceUrl })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message ?? t.updateFailed);
      setMessage({ text: t.watchAdded });
      await fetchFinds();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : t.updateFailed, error: true });
    } finally {
      setUpdatingId(null);
    }
  };

  const removeWatchPage = async (key: string) => {
    if (!window.confirm(t.watch.removeConfirm)) return;
    setRemovingKey(key);
    setMessage(null);
    try {
      const res = await fetch(`/api/v1/admin/giveaway-watch-pages?key=${encodeURIComponent(key)}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message ?? t.updateFailed);
      setMessage({ text: t.watch.removed });
      await fetchFinds();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : t.updateFailed, error: true });
    } finally {
      setRemovingKey(null);
    }
  };

  const runNow = async () => {
    setRunning(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/cron/discover-giveaways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message ?? t.runFailed);
      const s = json?.data?.summary as GiveawayDiscoverySummary | undefined;
      if (s) {
        setMessage({
          text: t.runSummary
            .replace("{created}", String(s.findsCreated))
            .replace("{updated}", String(s.findsUpdated))
            .replace("{fetched}", String(s.detailFetched))
            .replace("{errors}", String(s.errors.length)),
          error: s.errors.length > 0
        });
      }
      await fetchFinds();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : t.runFailed, error: true });
    } finally {
      setRunning(false);
    }
  };

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return data.finds.filter(find => {
      if (statusFilter !== "all" && find.status !== statusFilter) return false;
      if (sourceFilter !== "all" && find.sourceId !== sourceFilter) return false;
      if (matchFilter === "matched" && !find.program) return false;
      if (matchFilter === "possible" && find.program) return false;
      if (!q) return true;
      return [
        find.sourceTitle,
        find.program?.title,
        ...(find.candidates ?? []).map(c => c.program?.title),
        ...(find.keys ?? []).map(k => k.value),
        ...(find.accounts ?? []).map(a => a.username)
      ].some(v => v?.toLowerCase().includes(q));
    });
  }, [data.finds, searchTerm, statusFilter, sourceFilter, matchFilter]);

  const countByStatus = (status: GiveawayFindStatus) => data.finds.filter(f => f.status === status).length;

  if (loading) {
    return (
      <ProtectedAdminLayout title={t.title} subtitle={t.subtitle}>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">{t.loading}</div>
        </div>
      </ProtectedAdminLayout>
    );
  }

  return (
    <ProtectedAdminLayout title={t.title} subtitle={t.subtitle}>
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-soft border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder={t.searchPlaceholder} className="w-full" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as GiveawayFindStatus | "all")}
              className={selectClass}>
              <option value="all">
                {t.statusAll} ({data.finds.length})
              </option>
              {(Object.keys(t.status) as GiveawayFindStatus[]).map(s => (
                <option key={s} value={s}>
                  {t.status[s]} ({countByStatus(s)})
                </option>
              ))}
            </select>
            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className={selectClass}>
              <option value="all">{t.sourceAll}</option>
              {data.sources.map(s => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={matchFilter}
              onChange={e => setMatchFilter(e.target.value as "all" | "matched" | "possible")}
              className={selectClass}>
              <option value="all">{t.matchAll}</option>
              <option value="matched">{t.matchMatched}</option>
              <option value="possible">{t.matchPossible}</option>
            </select>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
            <button
              type="button"
              onClick={runNow}
              disabled={running}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 cursor-pointer disabled:opacity-60">
              {running ? t.running : t.runNow}
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t.lastRun}:{" "}
              {data.lastRun ? (
                <span className={data.lastRun.status === "ok" ? "text-gray-700 dark:text-gray-300" : "text-red-600 dark:text-red-400"}>
                  {formatRelativeTimeCompact(data.lastRun.ranAt)}
                  {data.lastRun.details ? ` (${data.lastRun.details})` : ""}
                </span>
              ) : (
                t.never
              )}
            </span>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 md:ml-auto" title={t.rememberNamesHint}>
              <input
                type="checkbox"
                checked={rememberNames}
                onChange={e => setRememberNames(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-700"
              />
              {t.rememberNames}
            </label>
          </div>

          {message && (
            <p className={`text-sm ${message.error ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-300"}`}>{message.text}</p>
          )}
        </div>
      </div>

      <WatchPagesPanel pages={data.watchPages} removingKey={removingKey} onRemove={removeWatchPage} />

      <GiveawayFindsTable
        finds={filtered}
        sources={data.sources}
        programs={data.programs}
        updatingId={updatingId}
        onUpdate={handleUpdate}
        onAddEntry={(find, preset) =>
          setAddTarget({ find, preset: preset && preset.kind !== "link" ? { kind: preset.kind, value: preset.value } : null })
        }
        onWatch={watchFind}
      />

      {addTarget && (
        <AddEntryModal
          find={addTarget.find}
          preset={addTarget.preset}
          onClose={() => setAddTarget(null)}
          onAdded={async text => {
            setAddTarget(null);
            setMessage({ text });
            await fetchFinds();
          }}
        />
      )}
    </ProtectedAdminLayout>
  );
}
