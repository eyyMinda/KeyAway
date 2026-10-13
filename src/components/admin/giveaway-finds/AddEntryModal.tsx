"use client";

import { useState } from "react";
import AdminDetailsModal from "@/src/components/admin/AdminDetailsModal";
import t from "@/src/locales/admin/giveaway-finds/en.json";
import type { GiveawayFind } from "@/src/types/giveaways";
import type { CDKeyStatus, ProgramFlow } from "@/src/types/program";

/** Which found item the modal was opened from (prefills that key/account). */
export type AddEntryPreset = { kind: "key" | "account"; value: string } | null;

interface AddEntryModalProps {
  find: GiveawayFind;
  preset: AddEntryPreset;
  onClose: () => void;
  onAdded: (message: string) => void;
}

type LinkRow = { title: string; url: string; note: string };

const STATUSES: CDKeyStatus[] = ["new", "active", "expired", "limit"];

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent";

/** `<input type="date">` value (YYYY-MM-DD) from an ISO datetime. */
function toDateInput(iso?: string): string {
  if (!iso) return "";
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? "" : new Date(ms).toISOString().slice(0, 10);
}

function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-800 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-500 mt-1">{hint}</span>}
    </label>
  );
}

/** Prefilled form that appends one activation entry (shape depends on the program's flow) to the program. */
export default function AddEntryModal({ find, preset, onClose, onAdded }: AddEntryModalProps) {
  const program = find.program!;
  const flow: ProgramFlow = program.programFlow ?? "cd_key";
  const isKeyFlow = flow === "cd_key" || flow === "link_based_cdkey";

  const newKeys = (find.keys ?? []).filter(k => k.isNew).map(k => k.value);
  const newAccounts = (find.accounts ?? []).filter(a => a.isNew);
  const account =
    (preset?.kind === "account" && newAccounts.find(a => a.username === preset.value)) || newAccounts[0] || undefined;

  const [key, setKey] = useState(preset?.kind === "key" ? preset.value : (newKeys[0] ?? ""));
  const [username, setUsername] = useState(account?.username ?? "");
  const [password, setPassword] = useState(account?.password ?? "");
  const [accountLabel, setAccountLabel] = useState("");
  const [links, setLinks] = useState<LinkRow[]>(() => {
    const fromFind = (find.links ?? [])
      .filter(l => !l.ignoredReason)
      .map(l => ({ title: l.label || hostLabel(l.url), url: l.url, note: "" }));
    return fromFind.length ? fromFind : [{ title: "", url: find.sourceUrl, note: "" }];
  });
  const [version, setVersion] = useState(find.version ?? "");
  const [status, setStatus] = useState<CDKeyStatus>("new");
  const [validFrom, setValidFrom] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState(toDateInput(find.validUntil));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateLink = (i: number, patch: Partial<LinkRow>) =>
    setLinks(rows => rows.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const entry: Record<string, unknown> = {
        status,
        version,
        // Dates are days; keep the whole day valid.
        validFrom: validFrom ? `${validFrom}T00:00:00.000Z` : undefined,
        validUntil: validUntil ? `${validUntil}T23:59:59.000Z` : undefined
      };
      if (isKeyFlow) entry.key = key;
      if (flow === "account") Object.assign(entry, { username, password, accountLabel });
      if (flow === "link_based_account") entry.giveawayLinks = links.filter(l => l.url.trim());

      const res = await fetch(`/api/v1/admin/giveaway-finds/${find._id}/add-entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message ?? t.addEntry.failed);
      onAdded(t.addEntry.added.replace("{program}", program.title));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.addEntry.failed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminDetailsModal
      title={t.addEntry.title}
      subtitle={`${program.title} · ${t.flow[flow]}`}
      accent="green"
      maxWidthClass="max-w-2xl"
      onClose={onClose}
      footer={error ? <span className="text-red-600">{error}</span> : t.addEntry.footerHint}
      footerActions={
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="cursor-pointer rounded-xl border-2 border-green-600 bg-green-600 px-6 py-3 text-base font-bold text-white shadow-lg hover:bg-green-700 disabled:opacity-60">
          {saving ? t.addEntry.saving : t.addEntry.save}
        </button>
      }>
      <div className="space-y-5">
        <p className="text-sm text-gray-600">
          {t.addEntry.from}{" "}
          <a href={find.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
            {find.sourceTitle}
          </a>
        </p>

        {isKeyFlow && (
          <Field label={t.addEntry.key} hint={newKeys.length > 1 ? t.addEntry.keyHint : undefined}>
            <input
              list="giveaway-new-keys"
              value={key}
              onChange={e => setKey(e.target.value)}
              className={`${inputClass} font-mono`}
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
            />
            <datalist id="giveaway-new-keys">
              {newKeys.map(k => (
                <option key={k} value={k} />
              ))}
            </datalist>
          </Field>
        )}

        {flow === "account" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t.addEntry.username}>
              <input value={username} onChange={e => setUsername(e.target.value)} className={inputClass} />
            </Field>
            <Field label={t.addEntry.password}>
              <input value={password} onChange={e => setPassword(e.target.value)} className={`${inputClass} font-mono`} />
            </Field>
            <Field label={t.addEntry.accountLabel}>
              <input value={accountLabel} onChange={e => setAccountLabel(e.target.value)} className={inputClass} />
            </Field>
          </div>
        )}

        {flow === "link_based_account" && (
          <div className="space-y-3">
            <span className="block text-sm font-medium text-gray-800">{t.addEntry.links}</span>
            {links.map((link, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2 items-start">
                <input
                  value={link.title}
                  onChange={e => updateLink(i, { title: e.target.value })}
                  placeholder={t.addEntry.linkTitle}
                  className={inputClass}
                />
                <input
                  value={link.url}
                  onChange={e => updateLink(i, { url: e.target.value })}
                  placeholder="https://"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setLinks(rows => rows.filter((_, j) => j !== i))}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-red-600 cursor-pointer">
                  {t.addEntry.removeLink}
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLinks(rows => [...rows, { title: "", url: "", note: "" }])}
              className="text-sm text-primary-600 hover:text-primary-700 cursor-pointer">
              + {t.addEntry.addLink}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t.addEntry.version}>
            <input value={version} onChange={e => setVersion(e.target.value)} className={inputClass} placeholder="e.g. 14.0" />
          </Field>
          <Field label={t.addEntry.status}>
            <select value={status} onChange={e => setStatus(e.target.value as CDKeyStatus)} className={inputClass}>
              {STATUSES.map(s => (
                <option key={s} value={s}>
                  {t.addEntry.statuses[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.addEntry.validFrom}>
            <input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} className={inputClass} />
          </Field>
          <Field label={t.addEntry.validUntil} hint={t.addEntry.validUntilHint}>
            <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className={inputClass} />
          </Field>
        </div>
      </div>
    </AdminDetailsModal>
  );
}
