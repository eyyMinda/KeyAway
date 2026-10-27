"use client";

import { useState } from "react";
import { isNewerVersion } from "@/src/lib/versions/compareVersions";
import { Card, Field, TextInput, Toggle, inputClass, subtleButton } from "./fields";
import { versionCheckValue, type ProgramForm } from "./programForm";
import type { TabProps } from "./types";

const SOURCES: { value: ProgramForm["versionSource"]; label: string }[] = [
  { value: "", label: "Not tracked" },
  { value: "installer", label: "Vendor installer (most accurate)" },
  { value: "page", label: "Vendor page (find version text)" },
  { value: "winget", label: "winget (Windows Package Manager)" },
  { value: "filepuma", label: "FilePuma (software library)" },
  { value: "chocolatey", label: "Chocolatey" },
  { value: "homebrew", label: "Homebrew cask (Mac)" }
];

const ID_HINTS: Record<string, { placeholder: string; hint: string; href: string }> = {
  winget: {
    placeholder: "IObit.DriverBooster",
    hint: "The winget id (Publisher.Name). Search for the program on winstall.app.",
    href: "https://winstall.app"
  },
  filepuma: {
    placeholder: "Driver Booster",
    hint: "The program name exactly as FilePuma lists it, without the version. Search filepuma.com to find it.",
    href: "https://www.filepuma.com/"
  },
  chocolatey: {
    placeholder: "driverbooster",
    hint: "The package id from the Chocolatey package URL.",
    href: "https://community.chocolatey.org/packages"
  },
  homebrew: {
    placeholder: "macbooster",
    hint: "The cask token from formulae.brew.sh/cask/<token>.",
    href: "https://formulae.brew.sh/cask/"
  }
};

type TestResult = { ok: true; version: string; url: string; releasedAt?: string; warning?: string } | { ok: false; error: string };
type FindResult = { ok: true; installerUrl: string; version?: string; releasedAt?: string } | { ok: false; error: string };

const formatDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "");

interface VersionTrackingCardProps extends TabProps {
  /** Stored result of the last check (`program.versionStatus`). */
  status?: { latestVersion?: string | null; releasedAt?: string | null; error?: string | null; changedAt?: string | null } | null;
}

export default function VersionTrackingCard({ form, update, errorOf, status }: VersionTrackingCardProps) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [productPage, setProductPage] = useState(form.versionPageUrl);
  const [finding, setFinding] = useState(false);
  const [found, setFound] = useState<FindResult | null>(null);
  const idHint = ID_HINTS[form.versionSource];

  /** Scans the product page's download links for the vendor's installer and fills in its URL. */
  const findInstaller = async () => {
    setFinding(true);
    setFound(null);
    try {
      const res = await fetch("/api/v1/admin/version-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findInstallerOn: productPage })
      });
      const data = await res.json().catch(() => ({}));
      const r = (res.ok ? data.data : { ok: false, error: data?.error?.message ?? "Lookup failed" }) as FindResult;
      setFound(r);
      if (r.ok) {
        update({ versionInstallerUrl: r.installerUrl });
        setResult(null);
      }
    } catch {
      setFound({ ok: false, error: "Network error" });
    } finally {
      setFinding(false);
    }
  };

  const test = async () => {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch("/api/v1/admin/version-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: versionCheckValue(form) })
      });
      const data = await res.json().catch(() => ({}));
      setResult(res.ok ? (data.data as TestResult) : { ok: false, error: data?.error?.message ?? "Lookup failed" });
    } catch {
      setResult({ ok: false, error: "Network error" });
    } finally {
      setTesting(false);
    }
  };

  const newer = result?.ok && isNewerVersion(result.version, form.latestOfficialVersion);

  return (
    <Card
      title="Version tracking"
      description="Checked daily at 06:00 UTC and compared as major.minor (14.0.1.462 → 14.0). New versions show up in the Versions tab.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Source">
          <select
            value={form.versionSource}
            onChange={e => {
              update({ versionSource: e.target.value as ProgramForm["versionSource"] });
              setResult(null);
            }}
            className={`${inputClass} cursor-pointer`}>
            {SOURCES.map(s => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        {form.versionSource === "installer" && (
          <TextInput
            label="Installer URL"
            type="url"
            value={form.versionInstallerUrl}
            error={errorOf("versionCheck.installerUrl")}
            placeholder="https://www.iobit.com/downloadcenter.php?product=…"
            onChange={versionInstallerUrl => update({ versionInstallerUrl })}
            hint="The vendor's direct download link: a Windows .exe, a Mac .pkg, or a .zip with an .exe inside. Only the first 1 MB is read (zips are read whole, up to 40 MB); the file date is the release date."
          />
        )}
        {form.versionSource === "page" && (
          <TextInput
            label="Page URL"
            type="url"
            value={form.versionPageUrl}
            error={errorOf("versionCheck.pageUrl")}
            placeholder="https://www.iobit.com/en/driver-booster.php"
            onChange={versionPageUrl => update({ versionPageUrl })}
          />
        )}
        {idHint && (
          <TextInput
            label="Package id"
            value={form.versionPackageId}
            error={errorOf("versionCheck.packageId")}
            placeholder={idHint.placeholder}
            onChange={versionPackageId => update({ versionPackageId })}
            hint={
              <a href={idHint.href} target="_blank" className="hover:underline">
                {idHint.hint}
              </a>
            }
          />
        )}
      </div>

      {form.versionSource === "installer" && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-950/50 border border-gray-100 dark:border-gray-800 p-3">
          <input
            value={productPage}
            onChange={e => setProductPage(e.target.value)}
            placeholder="Product page URL, e.g. https://www.iobit.com/en/driver-booster.php"
            aria-label="Product page URL"
            className={`${inputClass} flex-1 min-w-60`}
          />
          <button type="button" className={subtleButton} onClick={findInstaller} disabled={finding || !productPage.trim()}>
            {finding ? "Searching…" : "Find installer link"}
          </button>
          {found?.ok && (
            <span className="w-full text-xs text-green-700 dark:text-green-400">
              Found the installer{found.version ? ` (version ${found.version}${found.releasedAt ? `, ${formatDate(found.releasedAt)}` : ""})` : ""}. URL filled in above.
            </span>
          )}
          {found && !found.ok && <span className="w-full text-xs text-red-600 dark:text-red-400">{found.error}</span>}
        </div>
      )}

      {form.versionSource === "page" && (
        <TextInput
          label="Version pattern (optional)"
          value={form.versionPattern}
          error={errorOf("versionCheck.pattern")}
          placeholder="Version:\s*([\d.]+)"
          onChange={versionPattern => update({ versionPattern })}
          hint='Regex with one capture group. Empty finds text like "Version 12.0.1" or "v12.0" and takes the highest.'
        />
      )}

      {form.versionSource && (
        <>
          <Toggle
            label="Apply new versions automatically"
            hint="Otherwise a new version waits for your click in the Versions tab."
            checked={form.versionAutoApply}
            onChange={versionAutoApply => update({ versionAutoApply })}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={subtleButton} onClick={test} disabled={testing}>
              {testing ? "Checking…" : "Test now"}
            </button>
            {result?.ok && (
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Found <strong>{result.version}</strong>
                {newer ? (
                  <>
                    {" "}
                    (newer than {form.latestOfficialVersion || "the empty version"}){" "}
                    <button
                      type="button"
                      onClick={() => update({ latestOfficialVersion: result.version })}
                      className="ml-1 font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                      Use {result.version}
                    </button>
                  </>
                ) : (
                  " (up to date)"
                )}
                {result.releasedAt && <span className="text-gray-500"> · released {formatDate(result.releasedAt)}</span>}
                {" · "}
                <a href={result.url} target="_blank" className="text-gray-500 hover:underline">
                  source
                </a>
                {result.warning && <span className="block text-xs text-amber-600 dark:text-amber-400">{result.warning}</span>}
              </span>
            )}
            {result && !result.ok && <span className="text-sm text-red-600 dark:text-red-400">{result.error}</span>}
            {!result && status?.latestVersion && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Last found {status.latestVersion}
                {status.releasedAt ? ` (released ${formatDate(status.releasedAt)})` : ""}
                {status.error ? ` · last check failed: ${status.error}` : ""}
              </span>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
