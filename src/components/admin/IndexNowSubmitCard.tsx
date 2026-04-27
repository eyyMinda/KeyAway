"use client";

import { useMemo, useState } from "react";

type SubmitMode = "all" | "programs" | "non_programs" | "custom";

const MODE_OPTIONS: Array<{ value: SubmitMode; label: string }> = [
  { value: "all", label: "All" },
  { value: "programs", label: "Programs" },
  { value: "non_programs", label: "Non Programs" },
  { value: "custom", label: "Custom" }
];

export default function IndexNowSubmitCard() {
  const [mode, setMode] = useState<SubmitMode>("all");
  const [customUrls, setCustomUrls] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isCustom = useMemo(() => mode === "custom", [mode]);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/v1/admin/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, customUrls })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = payload?.error?.message ?? payload?.error ?? "Failed to submit IndexNow URLs";
        setError(message);
        return;
      }

      const count = payload?.data?.submittedCount ?? 0;
      setResult(`submitted ${count} url${count === 1 ? "" : "s"} to indexnow`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit IndexNow URLs");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-2">IndexNow Submit</h4>
      <p className="text-sm text-gray-600 mb-4">Push updated URLs to Bing IndexNow without waiting for recrawl.</p>

      <div className="space-y-4">
        <div>
          <label htmlFor="indexnow-mode" className="block text-sm font-medium text-gray-700 mb-2">
            URL set
          </label>
          <select
            id="indexnow-mode"
            value={mode}
            onChange={e => setMode(e.target.value as SubmitMode)}
            disabled={submitting}
            className="w-full md:w-72 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm cursor-pointer disabled:opacity-50">
            {MODE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {isCustom && (
          <div>
            <label htmlFor="indexnow-custom-urls" className="block text-sm font-medium text-gray-700 mb-2">
              Custom URLs
            </label>
            <textarea
              id="indexnow-custom-urls"
              value={customUrls}
              onChange={e => setCustomUrls(e.target.value)}
              disabled={submitting}
              rows={5}
              placeholder={
                "https://www.keyaway.app/programs\nhttps://www.keyaway.app/program/itop-vpn\n/program/some-slug"
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-2">
              Use one URL per line (or comma-separated). Relative paths are supported.
            </p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || (isCustom && customUrls.trim().length === 0)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            {submitting ? "Submitting..." : "Submit to IndexNow"}
          </button>
          {result && <p className="text-sm text-green-700">{result}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
