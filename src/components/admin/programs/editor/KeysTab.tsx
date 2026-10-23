"use client";

import { useMemo, useState } from "react";
import { FaChevronDown, FaCopy, FaEye, FaEyeSlash, FaPlus, FaTrash } from "react-icons/fa";
import { newKey } from "@/src/lib/admin/programFields";
import { isAccountFlow, isKeyLikeFlow, isLinkAccountFlow } from "@/src/lib/program/activationEntry";
import type { CDKeyStatus } from "@/src/types/program";
import { Card, Field, inputClass, subtleButton } from "./fields";
import { newKeyRow, type KeyRowForm } from "./programForm";
import type { TabProps } from "./types";

export const STATUS_STYLES: Record<CDKeyStatus, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30",
  active: "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/30",
  expired: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
  limit: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30"
};
export const STATUS_LABELS: Record<CDKeyStatus, string> = { new: "New", active: "Active", expired: "Expired", limit: "Limit reached" };
const STATUSES: CDKeyStatus[] = ["new", "active", "expired", "limit"];

type StatusFilter = "all" | "working" | CDKeyStatus;

function entryText(row: KeyRowForm): string {
  return [row.key, row.username, row.accountLabel, row.version, ...row.giveawayLinks.map(l => `${l.title} ${l.url}`)]
    .join(" ")
    .toLowerCase();
}

export default function KeysTab({ form, update, errorOf }: TabProps) {
  const flow = form.programFlow;
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkStatus, setBulkStatus] = useState<CDKeyStatus>("new");
  const [bulkVersion, setBulkVersion] = useState(form.latestOfficialVersion);
  const [bulkValidUntil, setBulkValidUntil] = useState("");

  const counts = useMemo(() => {
    const c: Record<CDKeyStatus, number> = { new: 0, active: 0, expired: 0, limit: 0 };
    for (const k of form.cdKeys) c[k.status]++;
    return c;
  }, [form.cdKeys]);

  const visible = form.cdKeys
    .map((row, index) => ({ row, index }))
    .filter(({ row }) =>
      filter === "all" ? true : filter === "working" ? row.status === "new" || row.status === "active" : row.status === filter
    )
    .filter(({ row }) => !query.trim() || entryText(row).includes(query.trim().toLowerCase()));

  const setRow = (index: number, patch: Partial<KeyRowForm>) =>
    update({ cdKeys: form.cdKeys.map((r, i) => (i === index ? { ...r, ...patch } : r)) });

  const addRow = () => {
    const row = newKeyRow({ version: form.latestOfficialVersion });
    update({ cdKeys: [row, ...form.cdKeys] });
    setExpanded(row._key);
    setFilter("all");
    setQuery("");
  };

  const existingKeys = new Set(form.cdKeys.map(k => k.key.replace(/\s+/g, "").toUpperCase()).filter(Boolean));
  const bulkKeys = [
    ...new Set(
      bulkText
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean)
    )
  ];
  const bulkNew = bulkKeys.filter(k => !existingKeys.has(k.replace(/\s+/g, "").toUpperCase()));

  const addBulk = () => {
    const rows = bulkNew.map(key =>
      newKeyRow({ key, status: bulkStatus, version: bulkVersion.trim(), validUntil: bulkValidUntil })
    );
    update({ cdKeys: [...rows, ...form.cdKeys] });
    setBulkText("");
    setBulkOpen(false);
  };

  const expiredCount = counts.expired;
  const filterChip = (value: StatusFilter, label: string, count: number) => (
    <button
      key={value}
      type="button"
      onClick={() => setFilter(value)}
      className={`px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer ${
        filter === value
          ? "bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-100"
          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400"
      }`}>
      {label} <span className="tabular-nums opacity-70">{count}</span>
    </button>
  );

  return (
    <div className="space-y-5">
      <Card
        title="Activation entries"
        description={
          isKeyLikeFlow(flow)
            ? "CD keys shown on the program page."
            : isAccountFlow(flow)
              ? "Shared PRO accounts (username + password)."
              : "Sets of links where visitors get a PRO account."
        }
        actions={
          <>
            {isKeyLikeFlow(flow) && (
              <button type="button" className={subtleButton} onClick={() => setBulkOpen(o => !o)}>
                Bulk paste
              </button>
            )}
            {expiredCount > 0 && (
              <button
                type="button"
                className={subtleButton}
                onClick={() => {
                  if (confirm(`Remove all ${expiredCount} expired entries? You can still discard before saving.`)) {
                    update({ cdKeys: form.cdKeys.filter(k => k.status !== "expired") });
                  }
                }}>
                Remove expired
              </button>
            )}
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 cursor-pointer">
              <FaPlus size={10} /> Add entry
            </button>
          </>
        }>
        {errorOf("cdKeys") && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {errorOf("cdKeys")}
          </p>
        )}

        {bulkOpen && (
          <div className="rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/5 p-4 space-y-3">
            <Field label="Keys, one per line" hint={bulkKeys.length ? `${bulkNew.length} new, ${bulkKeys.length - bulkNew.length} already on this program` : undefined}>
              <textarea
                rows={5}
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                placeholder={"XXXXX-XXXXX-XXXXX-XXXXX\nYYYYY-YYYYY-YYYYY-YYYYY"}
                className={`${inputClass} font-mono`}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Status">
                <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value as CDKeyStatus)} className={`${inputClass} cursor-pointer`}>
                  {STATUSES.map(s => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Version">
                <input value={bulkVersion} onChange={e => setBulkVersion(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Valid until">
                <input type="datetime-local" value={bulkValidUntil} onChange={e => setBulkValidUntil(e.target.value)} className={inputClass} />
              </Field>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!bulkNew.length}
                onClick={addBulk}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                Add {bulkNew.length || ""} keys
              </button>
              <button type="button" className={subtleButton} onClick={() => setBulkOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {filterChip("all", "All", form.cdKeys.length)}
          {filterChip("working", "Working", counts.new + counts.active)}
          {STATUSES.map(s => filterChip(s, STATUS_LABELS[s], counts[s]))}
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search entries…"
            className={`${inputClass} sm:ml-auto sm:w-56 py-1.5`}
          />
          {isAccountFlow(flow) && (
            <button type="button" className={subtleButton} onClick={() => setShowPasswords(s => !s)}>
              {showPasswords ? <FaEyeSlash size={12} /> : <FaEye size={12} />} Passwords
            </button>
          )}
        </div>

        {form.cdKeys.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">No entries yet.</p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">No entries match.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-lg border border-gray-200 dark:border-gray-800">
            {visible.map(({ row, index }) => {
              const open = expanded === row._key;
              return (
                <div key={row._key} className={open ? "bg-gray-50/70 dark:bg-gray-950/40" : ""}>
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-cols-[8.5rem_minmax(0,1fr)_6rem_11.5rem_auto] gap-2 items-center px-3 py-2">
                    <select
                      value={row.status}
                      aria-label="Status"
                      onChange={e => setRow(index, { status: e.target.value as CDKeyStatus })}
                      className={`text-xs font-medium rounded-md border px-2 py-1.5 cursor-pointer ${STATUS_STYLES[row.status]}`}>
                      {STATUSES.map(s => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>

                    <div className="min-w-0">
                      {isKeyLikeFlow(flow) && (
                        <input
                          value={row.key}
                          placeholder="XXXXX-XXXXX-XXXXX"
                          aria-label="Key"
                          onChange={e => setRow(index, { key: e.target.value })}
                          className={`${inputClass} font-mono py-1.5`}
                        />
                      )}
                      {isAccountFlow(flow) && (
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={row.username}
                            placeholder="Username / email"
                            aria-label="Username"
                            onChange={e => setRow(index, { username: e.target.value })}
                            className={`${inputClass} py-1.5`}
                          />
                          <input
                            type={showPasswords ? "text" : "password"}
                            value={row.password}
                            placeholder="Password"
                            aria-label="Password"
                            autoComplete="off"
                            onChange={e => setRow(index, { password: e.target.value })}
                            className={`${inputClass} py-1.5 font-mono`}
                          />
                        </div>
                      )}
                      {isLinkAccountFlow(flow) && (
                        <button
                          type="button"
                          onClick={() => setExpanded(open ? null : row._key)}
                          className="text-sm text-left truncate w-full text-gray-700 dark:text-gray-300 cursor-pointer">
                          {row.giveawayLinks.map(l => l.title || l.url).filter(Boolean).join(", ") || (
                            <span className="text-gray-400">No links yet. Expand to add.</span>
                          )}
                        </button>
                      )}
                    </div>

                    <input
                      value={row.version}
                      placeholder="Version"
                      aria-label="Version"
                      onChange={e => setRow(index, { version: e.target.value })}
                      className={`${inputClass} py-1.5 hidden sm:block`}
                    />
                    <input
                      type="datetime-local"
                      value={row.validUntil}
                      aria-label="Valid until"
                      title="Valid until (empty = lifetime)"
                      onChange={e => setRow(index, { validUntil: e.target.value })}
                      className={`${inputClass} py-1.5 hidden sm:block`}
                    />

                    <div className="flex items-center">
                      <button
                        type="button"
                        aria-label={open ? "Collapse" : "Expand"}
                        onClick={() => setExpanded(open ? null : row._key)}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                        <FaChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                      </button>
                      <button
                        type="button"
                        aria-label="Remove entry"
                        onClick={() => update({ cdKeys: form.cdKeys.filter((_, i) => i !== index) })}
                        className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer">
                        <FaTrash size={11} />
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div className="px-3 pb-3 pt-1 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-3">
                        {/* Version and valid-until sit in the row on wider screens. */}
                        <div className="sm:hidden">
                          <Field label="Version">
                            <input value={row.version} onChange={e => setRow(index, { version: e.target.value })} className={inputClass} />
                          </Field>
                        </div>
                        <Field label="Valid from">
                          <input
                            type="datetime-local"
                            value={row.validFrom}
                            onChange={e => setRow(index, { validFrom: e.target.value })}
                            className={inputClass}
                          />
                        </Field>
                        <div className="sm:hidden">
                          <Field label="Valid until" hint="Empty = lifetime">
                            <input
                              type="datetime-local"
                              value={row.validUntil}
                              onChange={e => setRow(index, { validUntil: e.target.value })}
                              className={inputClass}
                            />
                          </Field>
                        </div>
                      </div>
                      {isAccountFlow(flow) && (
                        <Field label="Label (optional)">
                          <input
                            value={row.accountLabel}
                            placeholder="Partner batch A"
                            onChange={e => setRow(index, { accountLabel: e.target.value })}
                            className={inputClass}
                          />
                        </Field>
                      )}
                      {isLinkAccountFlow(flow) && (
                        <div className="space-y-2">
                          {row.giveawayLinks.map((link, j) => {
                            const setLink = (patch: Partial<typeof link>) =>
                              setRow(index, { giveawayLinks: row.giveawayLinks.map((l, k) => (k === j ? { ...l, ...patch } : l)) });
                            return (
                              <div key={link._key} className="grid gap-2 sm:grid-cols-[1fr_1.5fr_1fr_auto] items-center">
                                <input value={link.title} placeholder="Title" aria-label="Link title" onChange={e => setLink({ title: e.target.value })} className={inputClass} />
                                <input value={link.url} placeholder="https://" aria-label="Link URL" onChange={e => setLink({ url: e.target.value })} className={inputClass} />
                                <input value={link.note} placeholder="Note (optional)" aria-label="Link note" onChange={e => setLink({ note: e.target.value })} className={inputClass} />
                                <button
                                  type="button"
                                  aria-label="Remove link"
                                  onClick={() => setRow(index, { giveawayLinks: row.giveawayLinks.filter((_, k) => k !== j) })}
                                  className="p-1.5 rounded-md text-gray-500 hover:text-red-600 cursor-pointer">
                                  <FaTrash size={11} />
                                </button>
                              </div>
                            );
                          })}
                          <button
                            type="button"
                            className={subtleButton}
                            onClick={() =>
                              setRow(index, { giveawayLinks: [...row.giveawayLinks, { _key: newKey(), title: "", url: "", note: "" }] })
                            }>
                            <FaPlus size={10} /> Add link
                          </button>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        {row.createdAt && <span>Added {new Date(row.createdAt).toLocaleString()}</span>}
                        {isKeyLikeFlow(flow) && row.key && (
                          <button
                            type="button"
                            onClick={() => navigator.clipboard?.writeText(row.key)}
                            className="inline-flex items-center gap-1 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer">
                            <FaCopy size={10} /> Copy key
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
