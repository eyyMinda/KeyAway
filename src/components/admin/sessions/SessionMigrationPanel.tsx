"use client";

import { useState } from "react";

type Preview = {
  trackingEventDocs: number;
  trackingEventBundleDocs: number;
  bundledEvents: number;
  sourceEvents: number;
  keyReports: number;
  keySuggestions: number;
  contactMessages: number;
  worstCaseNewDocs: number;
  checkpoint: { phase: string; visitors: number; sessions: number; events: number };
};

type VerifyRow = { event: string; source: number; copied: number; ok: boolean };

export default function SessionMigrationPanel() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [verify, setVerify] = useState<{ ok: boolean; rows: VerifyRow[] } | null>(null);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState("");

  async function loadPreview() {
    setLog("Counting source documents…");
    const res = await fetch("/api/v1/admin/sessions/migrate");
    const json = await res.json();
    setPreview(json.data ?? null);
    setLog("");
  }

  async function convert() {
    setRunning(true);
    setVerify(null);
    try {
      let done = false;
      for (let step = 0; step < 200 && !done; step++) {
        const res = await fetch("/api/v1/admin/sessions/migrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "batch", catchUp: step === 0 })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error?.message || "Convert failed");
        const data = json.data;
        if (!data) throw new Error("Convert failed");
        if (data?.busy) {
          setLog("Another convert is still running. Waiting…");
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        done = data?.done === true;
        const index = Number(data.sweepIndex ?? 0);
        const total = Number(data.bundleTotal ?? 0);
        const where = data.phase === "sweep" && total ? `bundle ${index}/${total}` : data.phase;
        setLog(
          `${where} · +${Number(data.batchEvents ?? 0).toLocaleString()} this batch · ${Number(data.events ?? 0).toLocaleString()} copied · skipped ${Number(data.batchSkipped ?? 0).toLocaleString()} · tracking ${Number(data.knownCopies ?? 0).toLocaleString()} source ids`
        );
        if (!done && data?.advanced === false) break;
      }
    } catch (error) {
      setLog(error instanceof Error ? error.message : "Convert failed");
    } finally {
      setRunning(false);
    }
  }

  async function attachHashless() {
    setRunning(true);
    setLog("Attaching rows that have no visitor hash…");
    try {
      const res = await fetch("/api/v1/admin/sessions/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "hashless" })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || "Attach failed");
      const data = json.data;
      setLog(
        `Attached ${Number(data?.events ?? 0).toLocaleString()} rows · ${Number(data?.matchedVisitors ?? 0).toLocaleString()} joined an existing visit · ${Number(data?.syntheticVisitors ?? 0).toLocaleString()} new visitor hashes · ${Number(data?.forms ?? 0).toLocaleString()} forms`
      );
    } catch (error) {
      setLog(error instanceof Error ? error.message : "Attach failed");
    } finally {
      setRunning(false);
    }
  }

  async function deleteConverted() {
    const confirmed = window.confirm(
      "Delete tracking events and event bundles that are already copied into sessions? Sessions, key reports, comments, suggestions, and contacts stay. Bundles that still have an uncopied row are skipped."
    );
    if (!confirmed) return;
    setRunning(true);
    setVerify(null);
    try {
      let done = false;
      for (let step = 0; step < 400 && !done; step++) {
        const res = await fetch("/api/v1/admin/sessions/migrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", restart: step === 0 })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error?.message || "Delete failed");
        const data = json.data;
        if (!data) throw new Error("Delete failed");
        done = data.done === true;
        setLog(
          `Deleted ${Number(data.deletedEvents ?? 0).toLocaleString()} live events and ${Number(data.deletedBundles ?? 0).toLocaleString()} event bundles this batch · skipped ${Number(data.skippedBundles ?? 0).toLocaleString()} bundles that are not fully copied`
        );
      }
    } catch (error) {
      setLog(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setRunning(false);
    }
  }

  async function check() {
    setLog("Comparing counts…");
    const res = await fetch("/api/v1/admin/sessions/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify" })
    });
    const json = await res.json();
    setVerify(json.data ?? null);
    setLog(json.data?.ok ? "Analytics counts match." : "Analytics counts do not match yet.");
  }

  return (
    <section className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
      <h3 className="text-lg font-semibold text-gray-900">Move old events into sessions</h3>
      <p className="mt-1 text-sm text-gray-700">
        Copies live events, bundled events, key reports, comments, suggestions, and contact messages into session
        bundles. Rows already copied are skipped. Source documents stay.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => void loadPreview()} className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-800 ring-1 ring-gray-300">
          Preview
        </button>
        <button
          type="button"
          disabled={running}
          onClick={() => void convert()}
          className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {running ? "Converting…" : "Convert"}
        </button>
        <button type="button" onClick={() => void check()} className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-800 ring-1 ring-gray-300">
          Verify counts
        </button>
        <button
          type="button"
          disabled={running}
          onClick={() => void attachHashless()}
          className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-800 ring-1 ring-gray-300 disabled:opacity-50"
        >
          Attach rows with no visitor hash
        </button>
        <button
          type="button"
          disabled={running}
          onClick={() => void deleteConverted()}
          className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-red-300 disabled:opacity-50"
        >
          Delete converted events
        </button>
      </div>
      {log ? <p className="mt-3 text-sm text-gray-800">{log}</p> : null}
      {preview ? (
        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-800 sm:grid-cols-3">
          <div>Live event docs: {preview.trackingEventDocs.toLocaleString()}</div>
          <div>Event bundles: {preview.trackingEventBundleDocs.toLocaleString()}</div>
          <div>Events inside bundles: {preview.bundledEvents.toLocaleString()}</div>
          <div>Key reports: {preview.keyReports.toLocaleString()}</div>
          <div>Suggestions: {preview.keySuggestions.toLocaleString()}</div>
          <div>Contact messages: {preview.contactMessages.toLocaleString()}</div>
          <div className="sm:col-span-3">
            Worst case new documents: {preview.worstCaseNewDocs.toLocaleString()} (800 sessions per bundle, nothing
            deleted)
          </div>
        </dl>
      ) : null}
      {verify ? (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase text-gray-500">
              <th className="py-1">Event</th>
              <th>Source</th>
              <th>In sessions</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {verify.rows.map(row => (
              <tr key={row.event} className="border-t border-amber-100">
                <td className="py-1">{row.event}</td>
                <td>{row.source.toLocaleString()}</td>
                <td>{row.copied.toLocaleString()}</td>
                <td>{row.ok ? "match" : "diff"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
