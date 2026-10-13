"use client";

import { useState } from "react";
import { FiCopy, FiCheck, FiExternalLink, FiEdit2, FiPlusCircle, FiEye } from "react-icons/fi";
import t from "@/src/locales/admin/giveaway-finds/en.json";
import { formatDateOnly, formatRelativeTimeCompact } from "@/src/lib/dateUtils";
import type {
  GiveawayFind,
  GiveawayFindStatus,
  GiveawayIgnoredItemKind,
  GiveawayIgnoreReason,
  GiveawaySourceOption
} from "@/src/types/giveaways";
import type { ProgramFlow } from "@/src/types/program";

export type ItemRef = { kind: GiveawayIgnoredItemKind; value: string };

export type GiveawayFindUpdate = {
  status?: GiveawayFindStatus;
  notes?: string;
  programId?: string;
  ignore?: ItemRef & { reason: GiveawayIgnoreReason };
  unignore?: ItemRef;
};

interface GiveawayFindsTableProps {
  finds: GiveawayFind[];
  /** Opens the prefilled "Add to program" modal (optionally for one specific key/account). */
  onAddEntry: (find: GiveawayFind, preset: ItemRef | null) => void;
  onWatch: (find: GiveawayFind) => void;
  sources: GiveawaySourceOption[];
  programs: { _id: string; title: string }[];
  updatingId: string | null;
  onUpdate: (id: string, updates: GiveawayFindUpdate) => void;
}

const STATUS_COLORS: Record<GiveawayFindStatus, string> = {
  new: "bg-blue-100 text-blue-800 border-blue-300",
  reviewing: "bg-yellow-100 text-yellow-800 border-yellow-300",
  added: "bg-green-100 text-green-800 border-green-300",
  dismissed: "bg-gray-100 text-gray-600 border-gray-300"
};

function flowLabel(flow?: string): string {
  return t.flow[(flow ?? "cd_key") as ProgramFlow] ?? flow ?? "";
}

const CHIP_STYLES = {
  new: { box: "bg-green-50 border-green-300 text-gray-900", badge: "text-green-700" },
  known: { box: "bg-gray-50 border-gray-200 text-gray-400", badge: "text-gray-400" },
  limit: { box: "bg-yellow-50 border-yellow-300 text-yellow-900", badge: "text-yellow-700" },
  invalid: { box: "bg-red-50 border-red-200 text-red-800 line-through", badge: "text-red-700" },
  expired: { box: "bg-yellow-50 border-yellow-300 text-yellow-900 line-through", badge: "text-yellow-700" }
} as const;

function CopyChip({
  value,
  isNew,
  ignoredReason
}: {
  value: string;
  isNew: boolean;
  ignoredReason?: GiveawayIgnoreReason;
}) {
  const [copied, setCopied] = useState(false);
  const state = ignoredReason ?? (isNew ? "new" : "known");
  const style = CHIP_STYLES[state];
  const badge = ignoredReason ? t.ignoredBadge[ignoredReason] : isNew ? t.newBadge : t.knownBadge;
  const copy = () => {
    navigator.clipboard
      ?.writeText(value)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      })
      .catch(() => {});
  };
  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? t.copied : t.copy}
      className={`group inline-flex items-center gap-1.5 max-w-full px-2 py-1 rounded border text-xs cursor-pointer ${style.box}`}>
      <span className="truncate font-mono">{value}</span>
      <span className={`shrink-0 text-[10px] font-semibold uppercase no-underline ${style.badge}`}>{badge}</span>
      {copied ? (
        <FiCheck className="w-3 h-3 shrink-0 text-green-600" />
      ) : (
        <FiCopy className="w-3 h-3 shrink-0 opacity-50 group-hover:opacity-100" />
      )}
    </button>
  );
}

/** Copy chip plus "Limit reached" / "Doesn't work" (new items) or "Undo" (ignored items). */
function ItemRow({
  kind,
  value,
  display,
  isNew,
  ignoredReason,
  disabled,
  onIgnore,
  onUnignore,
  onAdd
}: {
  kind: GiveawayIgnoredItemKind;
  value: string;
  display: string;
  isNew: boolean;
  ignoredReason?: GiveawayIgnoreReason;
  disabled: boolean;
  onIgnore: (ref: ItemRef, reason: GiveawayIgnoreReason) => void;
  onUnignore: (ref: ItemRef) => void;
  /** Present when the find has a program: opens the add modal prefilled with this item. */
  onAdd?: (ref: ItemRef) => void;
}) {
  const action = "text-[11px] cursor-pointer disabled:opacity-50 disabled:cursor-default";
  return (
    <div className="flex flex-col items-start gap-0.5 max-w-full">
      <CopyChip value={display} isNew={isNew} ignoredReason={ignoredReason} />
      {ignoredReason ? (
        <button
          type="button"
          disabled={disabled}
          title={t.undoIgnoreHint}
          onClick={() => onUnignore({ kind, value })}
          className={`${action} text-gray-500 hover:text-gray-800`}>
          {t.undoIgnore}
        </button>
      ) : (
        isNew && (
          <span className="flex gap-2">
            {onAdd && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onAdd({ kind, value })}
                className={`${action} font-semibold text-green-700 hover:text-green-900`}>
                {t.addThisKey}
              </button>
            )}
            <button
              type="button"
              disabled={disabled}
              title={t.markLimitHint}
              onClick={() => onIgnore({ kind, value }, "limit")}
              className={`${action} text-yellow-700 hover:text-yellow-900`}>
              {t.markLimit}
            </button>
            <button
              type="button"
              disabled={disabled}
              title={t.markInvalidHint}
              onClick={() => onIgnore({ kind, value }, "invalid")}
              className={`${action} text-red-600 hover:text-red-800`}>
              {t.markInvalid}
            </button>
          </span>
        )
      )}
    </div>
  );
}

/** Giveaway link plus "Expired" (new links) or "Undo" (ignored links). */
function LinkRow({
  url,
  label,
  isNew,
  ignoredReason,
  disabled,
  onIgnore,
  onUnignore
}: {
  url: string;
  label?: string;
  isNew: boolean;
  ignoredReason?: GiveawayIgnoreReason;
  disabled: boolean;
  onIgnore: (ref: ItemRef, reason: GiveawayIgnoreReason) => void;
  onUnignore: (ref: ItemRef) => void;
}) {
  const action = "text-[11px] cursor-pointer disabled:opacity-50 disabled:cursor-default";
  return (
    <div className="flex flex-col items-start gap-0.5 max-w-full">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 max-w-full text-xs ${
          ignoredReason
            ? "text-yellow-800 line-through"
            : isNew
              ? "text-primary-600 hover:text-primary-700"
              : "text-gray-400 hover:text-gray-600"
        }`}>
        <FiExternalLink className="w-3 h-3 shrink-0" />
        <span className="truncate">{label || url}</span>
        {ignoredReason && (
          <span className="shrink-0 text-[10px] font-semibold uppercase no-underline text-yellow-700">
            {t.ignoredBadge[ignoredReason]}
          </span>
        )}
      </a>
      {ignoredReason ? (
        <button
          type="button"
          disabled={disabled}
          title={t.undoIgnoreHint}
          onClick={() => onUnignore({ kind: "link", value: url })}
          className={`${action} text-gray-500 hover:text-gray-800`}>
          {t.undoIgnore}
        </button>
      ) : (
        <button
          type="button"
          disabled={disabled}
          title={t.markExpiredHint}
          onClick={() => onIgnore({ kind: "link", value: url }, "expired")}
          className={`${action} text-yellow-700 hover:text-yellow-900`}>
          {t.markExpired}
        </button>
      )}
    </div>
  );
}

function ProgramCell({
  find,
  programs,
  disabled,
  onAssign
}: {
  find: GiveawayFind;
  programs: GiveawayFindsTableProps["programs"];
  disabled: boolean;
  onAssign: (programId: string) => void;
}) {
  return (
    <div className="space-y-2 min-w-48">
      {find.program ? (
        <div>
          <div className="font-medium text-gray-900">{find.program.title}</div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
              {flowLabel(find.program.programFlow)}
            </span>
            <span className="text-[11px] text-gray-500">
              {t.matchMethod[find.matchMethod] ?? find.matchMethod}
              {typeof find.matchConfidence === "number" && find.matchMethod !== "manual"
                ? ` · ${find.matchConfidence.toFixed(2)}`
                : ""}
            </span>
          </div>
        </div>
      ) : (
        <div>
          <div className="text-sm font-medium text-amber-700">{t.possibleMatch}</div>
          <div className="flex flex-col items-start gap-1 mt-1">
            {(find.candidates ?? [])
              .filter(c => c.program)
              .map(c => (
                <button
                  key={c._key ?? c.program!._id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onAssign(c.program!._id)}
                  className="text-xs px-2 py-1 rounded border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 cursor-pointer disabled:opacity-50">
                  {t.confirm}: {c.program!.title} ({c.score.toFixed(2)})
                </button>
              ))}
          </div>
        </div>
      )}
      <select
        value=""
        disabled={disabled}
        onChange={e => e.target.value && onAssign(e.target.value)}
        className="w-full max-w-56 px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 disabled:opacity-50">
        <option value="">{find.program ? t.changeProgram : t.assignProgram}</option>
        {programs.map(p => (
          <option key={p._id} value={p._id}>
            {p.title}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function GiveawayFindsTable({
  finds,
  sources,
  programs,
  updatingId,
  onUpdate,
  onAddEntry,
  onWatch
}: GiveawayFindsTableProps) {
  const sourceLabel = (key: string) => sources.find(s => s.key === key)?.label ?? key;
  if (finds.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-12 text-center">
        <div className="text-4xl mb-4">🎁</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t.emptyTitle}</h3>
        <p className="text-gray-500">{t.emptyBody}</p>
      </div>
    );
  }

  const columns = [t.columns.program, t.columns.giveaway, t.columns.found, t.columns.details, t.columns.status, t.columns.actions];

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{t.tableTitle}</h3>
        <p className="text-sm text-gray-500 mt-1">Total: {finds.length}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(label => (
                <th
                  key={label}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {finds.map(find => {
              const busy = updatingId === find._id;
              const muted = find.status === "dismissed" || find.status === "added";
              const programFlow = find.program?.programFlow ?? "cd_key";
              const flowMismatch = Boolean(find.program && find.detectedFlow && find.detectedFlow !== programFlow);
              const hasItems = Boolean(find.keys?.length || find.accounts?.length || find.links?.length);
              return (
                <tr key={find._id} className={`align-top hover:bg-gray-50 ${muted ? "opacity-70" : ""}`}>
                  <td className="px-4 py-4">
                    <ProgramCell
                      find={find}
                      programs={programs}
                      disabled={busy}
                      onAssign={programId => onUpdate(find._id, { programId })}
                    />
                  </td>
                  <td className="px-4 py-4 min-w-64 max-w-sm">
                    <a
                      href={find.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary-600 hover:text-primary-700 break-words">
                      {find.sourceTitle}
                    </a>
                    <div className="text-xs text-gray-500 mt-1">
                      {sourceLabel(find.sourceId)}
                      {find.publishedAt ? ` · ${formatDateOnly(find.publishedAt)}` : ""}
                    </div>
                    {find.excerpt && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-3" title={find.excerpt}>
                        {find.excerpt}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 min-w-56 max-w-xs">
                    {hasItems ? (
                      <div className="flex flex-col items-start gap-1.5">
                        {(find.keys ?? []).map(k => (
                          <ItemRow
                            key={k._key ?? k.value}
                            kind="key"
                            value={k.value}
                            display={k.value}
                            isNew={k.isNew}
                            ignoredReason={k.ignoredReason}
                            disabled={busy}
                            onIgnore={(ref, reason) => onUpdate(find._id, { ignore: { ...ref, reason } })}
                            onUnignore={ref => onUpdate(find._id, { unignore: ref })}
                            onAdd={find.program ? ref => onAddEntry(find, ref) : undefined}
                          />
                        ))}
                        {(find.accounts ?? []).map(a => (
                          <ItemRow
                            key={a._key ?? a.username}
                            kind="account"
                            value={a.username}
                            display={a.password ? `${a.username} / ${a.password}` : a.username}
                            isNew={a.isNew}
                            ignoredReason={a.ignoredReason}
                            disabled={busy}
                            onIgnore={(ref, reason) => onUpdate(find._id, { ignore: { ...ref, reason } })}
                            onUnignore={ref => onUpdate(find._id, { unignore: ref })}
                            onAdd={find.program ? ref => onAddEntry(find, ref) : undefined}
                          />
                        ))}
                        {(find.links ?? []).map(l => (
                          <LinkRow
                            key={l._key ?? l.url}
                            url={l.url}
                            label={l.label}
                            isNew={l.isNew}
                            ignoredReason={l.ignoredReason}
                            disabled={busy}
                            onIgnore={(ref, reason) => onUpdate(find._id, { ignore: { ...ref, reason } })}
                            onUnignore={ref => onUpdate(find._id, { unignore: ref })}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500 italic">{t.linkOnly}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-600 whitespace-nowrap space-y-1">
                    {find.version && (
                      <div>
                        {t.version}: <span className="text-gray-900">{find.version}</span>
                      </div>
                    )}
                    {find.validUntil && (
                      <div>
                        {t.validUntil}: <span className="text-gray-900">{formatDateOnly(find.validUntil)}</span>
                      </div>
                    )}
                    {find.detectedFlow && (
                      <div>
                        {t.detectedFlow}: <span className="text-gray-900">{flowLabel(find.detectedFlow)}</span>
                      </div>
                    )}
                    {flowMismatch && (
                      <div className="text-amber-700">⚠ {t.flowMismatch.replace("{flow}", flowLabel(programFlow))}</div>
                    )}
                    <div className="pt-1 text-gray-500">
                      {t.firstSeen} {formatRelativeTimeCompact(find.firstSeenAt)}
                    </div>
                    {find.lastChangedAt && find.lastChangedAt !== find.firstSeenAt && (
                      <div className="text-gray-500">
                        {t.changed} {formatRelativeTimeCompact(find.lastChangedAt)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={find.status}
                      disabled={busy}
                      onChange={e => onUpdate(find._id, { status: e.target.value as GiveawayFindStatus })}
                      className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer ${STATUS_COLORS[find.status]} disabled:opacity-50`}>
                      {(Object.keys(t.status) as GiveawayFindStatus[]).map(s => (
                        <option key={s} value={s}>
                          {t.status[s]}
                        </option>
                      ))}
                    </select>
                    {find.status === "dismissed" && find.dismissedReason === "expired" && (
                      <div className="text-[11px] text-gray-500 mt-1 whitespace-nowrap">{t.dismissedExpired}</div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-start gap-1.5 text-xs whitespace-nowrap">
                      {find.program && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onAddEntry(find, null)}
                          className="inline-flex items-center gap-1 font-semibold text-green-700 hover:text-green-900 cursor-pointer disabled:opacity-50">
                          <FiPlusCircle className="w-3.5 h-3.5" /> {t.addToProgram}
                        </button>
                      )}
                      {find.program &&
                        (find.watched ? (
                          <span className="inline-flex items-center gap-1 text-gray-400">
                            <FiEye className="w-3.5 h-3.5" /> {t.watching}
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            title={t.watchThisPageHint}
                            onClick={() => onWatch(find)}
                            className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900 cursor-pointer disabled:opacity-50">
                            <FiEye className="w-3.5 h-3.5" /> {t.watchThisPage}
                          </button>
                        ))}
                      <a
                        href={find.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700">
                        <FiExternalLink className="w-3.5 h-3.5" /> {t.openSource}
                      </a>
                      {find.program && (
                        <a
                          href={`/studio/intent/edit/id=${find.program._id};type=program`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900">
                          <FiEdit2 className="w-3.5 h-3.5" /> {t.openStudio}
                        </a>
                      )}
                      {find.status !== "added" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onUpdate(find._id, { status: "added" })}
                          className="text-green-700 hover:text-green-800 cursor-pointer disabled:opacity-50">
                          {t.markAdded}
                        </button>
                      )}
                      {find.status !== "dismissed" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onUpdate(find._id, { status: "dismissed" })}
                          className="text-gray-500 hover:text-gray-700 cursor-pointer disabled:opacity-50">
                          {t.dismiss}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
