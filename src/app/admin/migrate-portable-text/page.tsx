"use client";

import { useCallback, useState } from "react";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";

type MigrateResult = {
  dryRun: boolean;
  totalPrograms: number;
  wouldPatchCount: number;
  wouldPatchIds?: string[];
  patchedCount: number;
  errorCount: number;
  errors: { id: string; message: string }[];
};

type StoreMigrateResult = Record<string, unknown>;

export default function MigratePortableTextPage() {
  const [loading, setLoading] = useState(false);
  const [dryLoading, setDryLoading] = useState(false);
  const [result, setResult] = useState<MigrateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [storeLoading, setStoreLoading] = useState(false);
  const [storeDryLoading, setStoreDryLoading] = useState(false);
  const [storeResult, setStoreResult] = useState<StoreMigrateResult | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);

  const runStore = useCallback(async (dryRun: boolean) => {
    setStoreError(null);
    if (dryRun) setStoreDryLoading(true);
    else setStoreLoading(true);
    try {
      const res = await fetch("/api/v1/admin/migrate-store-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStoreError(json?.error?.message ?? json?.error ?? `Request failed (${res.status})`);
        setStoreResult(null);
        return;
      }
      setStoreResult(json.data as StoreMigrateResult);
    } finally {
      setStoreDryLoading(false);
      setStoreLoading(false);
    }
  }, []);

  const run = useCallback(async (dryRun: boolean) => {
    setError(null);
    if (dryRun) setDryLoading(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/migrate-program-portable-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error?.message ?? json?.error ?? `Request failed (${res.status})`);
        setResult(null);
        return;
      }
      setResult(json.data as MigrateResult);
    } finally {
      setDryLoading(false);
      setLoading(false);
    }
  }, []);

  return (
    <ProtectedAdminLayout title="Migrate program copy" subtitle="String fields to portable text (one-time)">
      <div className="max-w-3xl space-y-6 text-gray-800">
        <p className="text-sm text-gray-600">
          Converts legacy <code className="rounded bg-gray-100 px-1">string</code> values on all programs to Sanity
          block arrays: <code className="rounded bg-gray-100 px-1">description</code>,{" "}
          <code className="rounded bg-gray-100 px-1">aboutSections</code>, <code className="rounded bg-gray-100 px-1">faq</code>, and{" "}
          <code className="rounded bg-gray-100 px-1">featured</code> (including removing{" "}
          <code className="rounded bg-gray-100 px-1">featured.featuredDescription</code>).
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void run(true)}
            disabled={dryLoading || loading}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-900 font-medium cursor-pointer">
            {dryLoading ? "Running…" : "Dry run"}
          </button>
          <button
            type="button"
            onClick={() => void run(false)}
            disabled={dryLoading || loading}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium cursor-pointer">
            {loading ? "Migrating…" : "Run migration"}
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {result && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm space-y-2">
            <p>
              <strong>Mode:</strong> {result.dryRun ? "dry run" : "live"}
            </p>
            <p>
              <strong>Programs fetched:</strong> {result.totalPrograms}
            </p>
            {result.dryRun ? (
              <p>
                <strong>Would patch:</strong> {result.wouldPatchCount} documents
              </p>
            ) : (
              <p>
                <strong>Patched:</strong> {result.patchedCount} documents
              </p>
            )}
            {result.errorCount > 0 && (
              <p className="text-red-600">
                <strong>Errors:</strong> {result.errorCount}
              </p>
            )}
            {result.wouldPatchIds && result.wouldPatchIds.length > 0 && (
              <div>
                <p className="font-medium text-gray-700">Sample ids (max 50):</p>
                <ul className="mt-1 font-mono text-xs text-gray-600 break-all max-h-40 overflow-y-auto">
                  {result.wouldPatchIds.map(id => (
                    <li key={id}>{id}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.errors?.length > 0 && (
              <ul className="text-xs text-red-700 space-y-1">
                {result.errors.map(e => (
                  <li key={e.id}>
                    {e.id}: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <hr className="max-w-3xl my-10 border-gray-200" />

      <div className="max-w-3xl space-y-6 text-gray-800">
        <h2 className="text-lg font-semibold text-gray-900">Store details migration</h2>
        <p className="text-sm text-gray-600">
          Embeds referenced <code className="rounded bg-gray-100 px-1">header</code> and{" "}
          <code className="rounded bg-gray-100 px-1">footer</code> documents into{" "}
          <code className="rounded bg-gray-100 px-1">storeDetails</code>, and copies standalone{" "}
          <code className="rounded bg-gray-100 px-1">socialLink</code> documents into{" "}
          <code className="rounded bg-gray-100 px-1">storeDetails.socialLinks</code> when that array is empty. Run after
          deploying the new schema.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void runStore(true)}
            disabled={storeDryLoading || storeLoading}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-900 font-medium cursor-pointer">
            {storeDryLoading ? "Running…" : "Dry run (store)"}
          </button>
          <button
            type="button"
            onClick={() => void runStore(false)}
            disabled={storeDryLoading || storeLoading}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium cursor-pointer">
            {storeLoading ? "Migrating…" : "Run store migration"}
          </button>
        </div>
        {storeError && (
          <p className="text-sm text-red-600" role="alert">
            {storeError}
          </p>
        )}
        {storeResult && (
          <pre className="rounded-lg border border-gray-200 bg-white p-4 text-xs overflow-x-auto text-gray-800">
            {JSON.stringify(storeResult, null, 2)}
          </pre>
        )}
      </div>
    </ProtectedAdminLayout>
  );
}
