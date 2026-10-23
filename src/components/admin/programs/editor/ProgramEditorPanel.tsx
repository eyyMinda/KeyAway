"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaExclamationTriangle, FaExternalLinkAlt, FaMagic, FaTimes } from "react-icons/fa";
import { buildProgramPrompt, scrapeToProgramPrefill } from "@/src/lib/prefill/prefillFormat";
import type { ScrapeResult } from "@/src/lib/prefill/scrapePage";
import { urlFor } from "@/src/sanity/lib/image";
import { tabOfField, validateProgramFields, type ProgramEditorTab, type ProgramFieldError } from "@/src/lib/admin/programFields";
import type { AdminProgramDoc, AdminProgramRow } from "@/src/types/admin";
import ImageLibraryModal from "../ImageLibraryModal";
import DeleteProgramModal from "../DeleteProgramModal";
import SlugChangeConfirmModal from "../SlugChangeConfirmModal";
import { titleToSlug } from "../programSlugUtils";
import { changedFields, docToForm, formToFields, type ProgramForm } from "./programForm";
import BasicsTab from "./BasicsTab";
import ContentTab from "./ContentTab";
import KeysTab from "./KeysTab";
import MediaTab from "./MediaTab";
import SeoTab from "./SeoTab";
import type { EditorLookups } from "./types";
import PrefillDialog from "../prefill/PrefillDialog";
import { applyProgramPrefill, programFormToPrefill, programPrefillGroups, type ProgramPrefillGroup } from "../prefill/applyPrefill";

export const EDITOR_TABS: { id: ProgramEditorTab; label: string }[] = [
  { id: "basics", label: "Basics" },
  { id: "content", label: "Content" },
  { id: "keys", label: "Keys" },
  { id: "media", label: "Media" },
  { id: "seo", label: "SEO & discovery" }
];

const FLOW_BADGE: Record<string, string> = {
  cd_key: "CD keys",
  link_based_cdkey: "Link CD keys",
  account: "Accounts",
  link_based_account: "Account links"
};

interface ProgramEditorPanelProps {
  /** Program to edit; `null` creates a new one. */
  programId: string | null;
  tab: ProgramEditorTab;
  onTabChange: (tab: ProgramEditorTab) => void;
  lookups: EditorLookups;
  onClose: () => void;
  /** After a successful save; `created` when a new program got its id. */
  onSaved: (row: AdminProgramRow | null, created: boolean) => void;
  onDeleted: (id: string) => void;
}

const EMPTY_SCRAPE: ScrapeResult = { pages: [], faqs: [], errors: [] };
const programFromScrape = (scrape: ScrapeResult) => ({ kind: "program" as const, program: scrapeToProgramPrefill(scrape) });

type BasicsVersionStatus = AdminProgramRow["versionStatus"];
type Banner = { kind: "error" | "conflict"; message: string } | null;
type LoadResult = { doc: AdminProgramDoc } | { error: string };

async function fetchEditorDoc(id: string): Promise<LoadResult> {
  try {
    const res = await fetch(`/api/v1/admin/programs/${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data?.error?.message ?? "Failed to load program" };
    return { doc: data.data as AdminProgramDoc };
  } catch {
    return { error: "Network error while loading the program" };
  }
}

export default function ProgramEditorPanel({
  programId,
  tab,
  onTabChange,
  lookups,
  onClose,
  onSaved,
  onDeleted
}: ProgramEditorPanelProps) {
  const isNew = programId === null;
  const [doc, setDoc] = useState<AdminProgramDoc | null>(null);
  const [base, setBase] = useState<ProgramForm>(() => docToForm(null));
  const [form, setForm] = useState<ProgramForm>(() => docToForm(null));
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState<ProgramFieldError[]>([]);
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugConfirmOpen, setSlugConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [library, setLibrary] = useState<((assetId: string) => void) | null>(null);
  const [prefillOpen, setPrefillOpen] = useState(false);
  /** Groups filled by the last prefill, shown until the next save so they get reviewed. */
  const [prefilled, setPrefilled] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const applyLoaded = useCallback((result: LoadResult) => {
    if ("error" in result) {
      setLoadError(result.error);
    } else {
      const f = docToForm(result.doc);
      setDoc(result.doc);
      setBase(f);
      setForm(f);
      setLoadError(null);
      setBanner(null);
      setAttempted(false);
      setServerErrors([]);
    }
    setLoading(false);
  }, []);

  const reload = () => {
    if (!programId) return;
    setLoading(true);
    void fetchEditorDoc(programId).then(applyLoaded);
  };

  useEffect(() => {
    if (!programId) return;
    let cancelled = false;
    void fetchEditorDoc(programId).then(result => {
      if (!cancelled) applyLoaded(result);
    });
    return () => {
      cancelled = true;
    };
  }, [programId, applyLoaded]);

  const changes = useMemo(() => changedFields(base, form), [base, form]);
  const dirty = isNew || Object.keys(changes).length > 0;
  const hasChanges = Object.keys(changes).length > 0;
  const errors = useMemo(() => [...validateProgramFields(formToFields(form)), ...serverErrors], [form, serverErrors]);
  const visibleErrors = useMemo(() => (attempted ? errors : []), [attempted, errors]);
  const errorOf = useCallback(
    (field: string) => visibleErrors.find(e => e.field === field)?.message,
    [visibleErrors]
  );
  const errorCountByTab = useMemo(() => {
    const counts: Partial<Record<ProgramEditorTab, number>> = {};
    for (const e of visibleErrors) counts[e.tab] = (counts[e.tab] ?? 0) + 1;
    return counts;
  }, [visibleErrors]);

  const update = useCallback(
    (patch: Partial<ProgramForm>) => {
      setServerErrors([]);
      if ("slug" in patch) setSlugTouched(true);
      setForm(prev => {
        const next = { ...prev, ...patch };
        if (isNew && !slugTouched && "title" in patch && !("slug" in patch)) next.slug = titleToSlug(patch.title ?? "");
        return next;
      });
    },
    [isNew, slugTouched]
  );

  const requestClose = useCallback(() => {
    if (hasChanges && !confirm("Discard unsaved changes?")) return;
    onClose();
  }, [hasChanges, onClose]);

  const rev = doc?._rev;
  const performSave = useCallback(async () => {
    setSlugConfirmOpen(false);
    setSaving(true);
    setBanner(null);
    try {
      const res = await fetch(isNew ? "/api/v1/admin/programs" : `/api/v1/admin/programs/${programId}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isNew ? { fields: formToFields(form) } : { rev, fields: changes })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setBanner({ kind: "conflict", message: data?.error?.message ?? "This program changed since you opened it." });
        return;
      }
      if (!res.ok) {
        const details: { field?: string; message: string }[] = data?.error?.details ?? [];
        if (details.length) {
          setServerErrors(
            details
              .filter(d => d.field)
              .map(d => ({ field: d.field!, message: d.message, tab: tabOfField(d.field!) }))
          );
          setAttempted(true);
        }
        setBanner({ kind: "error", message: data?.error?.message ?? "Failed to save" });
        return;
      }
      const saved = data.data as { doc: AdminProgramDoc | null; row: AdminProgramRow | null };
      if (saved.doc) {
        const f = docToForm(saved.doc);
        setDoc(saved.doc);
        setBase(f);
        setForm(f);
      }
      setAttempted(false);
      setSlugTouched(false);
      setPrefilled([]);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
      onSaved(saved.row, isNew);
    } catch {
      setBanner({ kind: "error", message: "Network error while saving" });
    } finally {
      setSaving(false);
    }
  }, [isNew, programId, form, rev, changes, onSaved]);

  const save = useCallback(() => {
    if (saving || (!isNew && !hasChanges)) return;
    const clientErrors = validateProgramFields(formToFields(form));
    if (clientErrors.length) {
      setAttempted(true);
      onTabChange(clientErrors[0].tab);
      return;
    }
    if (!isNew && base.slug && form.slug !== base.slug) {
      setSlugConfirmOpen(true);
      return;
    }
    void performSave();
  }, [saving, isNew, hasChanges, form, base.slug, onTabChange, performSave]);

  const handleDelete = async () => {
    if (!programId || deleteConfirm.trim() !== base.title.trim()) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/v1/admin/programs/${programId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data?.error?.message ?? "Failed to delete");
        return;
      }
      onDeleted(programId);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Keyboard: Esc closes (or the open sub-dialog), Ctrl/Cmd+S saves.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      } else if (e.key === "Escape") {
        if (library) setLibrary(null);
        else if (prefillOpen) setPrefillOpen(false);
        else if (slugConfirmOpen) setSlugConfirmOpen(false);
        else if (deleteOpen) setDeleteOpen(false);
        else requestClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [save, requestClose, library, prefillOpen, slugConfirmOpen, deleteOpen]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!hasChanges) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasChanges]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  const openLibrary = useCallback((onPick: (assetId: string) => void) => setLibrary(() => onPick), []);
  const tabProps = { form, update, errorOf };
  const savedSlug = (doc?.slug as { current?: string } | undefined)?.current ?? "";
  const tabCount: Partial<Record<ProgramEditorTab, number>> = {
    content: form.about.length + form.faq.length,
    keys: form.cdKeys.length
  };

  return (
    <div className="fixed inset-0 z-200 flex justify-end" role="dialog" aria-modal="true" aria-label={isNew ? "New program" : `Edit ${base.title}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-fadeIn" onClick={requestClose} />
      <div className="relative flex h-full w-full max-w-5xl flex-col bg-gray-50 dark:bg-gray-950 shadow-2xl border-l border-gray-200 dark:border-gray-800">
        {/* Header */}
        <header className="shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 px-5 pt-4 pb-3">
            <div className="h-11 w-11 shrink-0 rounded-lg overflow-hidden bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {form.image.assetId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={urlFor({ _type: "image", asset: { _ref: form.image.assetId } }).width(88).height(88).fit("crop").url()}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-white text-lg">🎮</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-gray-100">
                {form.title || (isNew ? "New program" : "Untitled")}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                <span>{FLOW_BADGE[form.programFlow]}</span>
                {form.latestOfficialVersion && <span>v{form.latestOfficialVersion}</span>}
                {!isNew && savedSlug && (
                  <a href={`/program/${savedSlug}`} target="_blank" className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400">
                    View page <FaExternalLinkAlt size={9} />
                  </a>
                )}
                {!isNew && (
                  <a
                    href={`/studio/structure/group-programs;program;${programId}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400">
                    Studio <FaExternalLinkAlt size={9} />
                  </a>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPrefillOpen(true)}
              disabled={loading || !!loadError}
              title="Fill fields from the vendor pages, scraped or rewritten by AI"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20 disabled:opacity-50 cursor-pointer">
              <FaMagic size={12} /> Prefill
            </button>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close editor"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
              <FaTimes />
            </button>
          </div>
          <nav className="flex gap-1 px-3 overflow-x-auto" aria-label="Editor sections">
            {EDITOR_TABS.map(t => {
              const active = t.id === tab;
              const errs = errorCountByTab[t.id];
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onTabChange(t.id)}
                  className={`relative whitespace-nowrap px-3 py-2.5 text-sm font-medium border-b-2 -mb-px cursor-pointer ${
                    active
                      ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}>
                  {t.label}
                  {tabCount[t.id] !== undefined && <span className="ml-1.5 text-xs tabular-nums opacity-60">{tabCount[t.id]}</span>}
                  {errs ? (
                    <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                      {errs}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </header>

        {/* Body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl p-5 space-y-4">
            {doc?.hasDraft && (
              <div className="flex gap-3 rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                <FaExclamationTriangle className="mt-0.5 shrink-0" />
                <p>
                  This program has unpublished changes in Studio. Saving here updates the live version; publishing that Studio draft later
                  will overwrite these edits. Publish or discard the draft first.
                </p>
              </div>
            )}
            {prefilled.length > 0 && (
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 px-4 py-3 text-sm text-blue-800 dark:text-blue-200">
                <FaMagic className="mt-0.5 shrink-0" />
                <p className="flex-1">
                  Prefilled: {prefilled.join(", ")}. Review these before saving; scraped and AI text can be wrong or repetitive.
                </p>
                <button type="button" onClick={() => setPrefilled([])} aria-label="Dismiss" className="opacity-60 hover:opacity-100 cursor-pointer">
                  <FaTimes size={12} />
                </button>
              </div>
            )}
            {banner && (
              <div
                className={`flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                  banner.kind === "conflict"
                    ? "border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200"
                    : "border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300"
                }`}>
                <span className="flex-1">{banner.message}</span>
                {banner.kind === "conflict" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasChanges || confirm("Reload the latest version? Your unsaved edits here will be lost.")) reload();
                    }}
                    className="px-3 py-1 rounded-md bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 cursor-pointer">
                    Reload latest
                  </button>
                )}
              </div>
            )}

            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
              </div>
            ) : loadError ? (
              <div className="rounded-lg border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 p-6 text-center text-sm text-red-700 dark:text-red-300">
                {loadError}
                <button type="button" onClick={reload} className="ml-3 underline cursor-pointer">
                  Retry
                </button>
              </div>
            ) : (
              <>
                {tab === "basics" && <BasicsTab
                    {...tabProps}
                    lookups={lookups}
                    isNew={isNew}
                    savedSlug={savedSlug}
                    versionStatus={doc?.versionStatus as BasicsVersionStatus}
                  />}
                {tab === "content" && <ContentTab {...tabProps} openLibrary={openLibrary} />}
                {tab === "keys" && <KeysTab {...tabProps} />}
                {tab === "media" && <MediaTab {...tabProps} openLibrary={openLibrary} />}
                {tab === "seo" && <SeoTab {...tabProps} />}

                {!isNew && tab === "basics" && (
                  <p className="pt-2 text-xs text-gray-500 dark:text-gray-400">
                    <button type="button" onClick={() => setDeleteOpen(true)} className="underline hover:text-red-600 cursor-pointer">
                      Delete this program
                    </button>{" "}
                    and all its activation entries. This cannot be undone.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Save bar */}
        <footer className="shrink-0 flex flex-wrap items-center gap-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-3">
          <div className="flex-1 min-w-0 text-sm">
            {visibleErrors.length > 0 ? (
              <button
                type="button"
                onClick={() => onTabChange(visibleErrors[0].tab)}
                className="text-red-600 dark:text-red-400 hover:underline cursor-pointer text-left">
                {visibleErrors.length === 1 ? visibleErrors[0].message : `${visibleErrors.length} issues to fix: ${visibleErrors[0].message}`}
              </button>
            ) : savedFlash ? (
              <span className="text-green-600 dark:text-green-400">Saved</span>
            ) : hasChanges ? (
              <span className="text-amber-600 dark:text-amber-400">
                Unsaved changes{!isNew && ` · ${Object.keys(changes).length} field${Object.keys(changes).length === 1 ? "" : "s"}`}
              </span>
            ) : (
              <span className="text-gray-400">{isNew ? "New program" : "No changes"}</span>
            )}
          </div>
          {hasChanges && !isNew && (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                if (confirm("Discard all unsaved changes?")) {
                  setForm(base);
                  setAttempted(false);
                  setServerErrors([]);
                }
              }}
              className="px-3 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
              Discard
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving || loading || !!loadError || !dirty}
            title="Ctrl+S"
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            {saving ? "Saving…" : isNew ? "Create program" : "Save changes"}
          </button>
        </footer>

        <ImageLibraryModal
          isOpen={!!library}
          onClose={() => setLibrary(null)}
          onSelect={assetId => {
            library?.(assetId);
            setLibrary(null);
          }}
        />
        {prefillOpen && (
          <PrefillDialog<ProgramPrefillGroup>
            kind="program"
            defaultUrl={form.versionSource === "page" ? form.versionPageUrl : ""}
            defaultName={form.title}
            buildPrompt={scrape =>
              buildProgramPrompt({
                scrape: scrape ?? EMPTY_SCRAPE,
                categories: lookups.categories.map(c => c.title),
                vendors: lookups.vendors.map(v => v.name),
                current: programFormToPrefill(form)
              })
            }
            fromScrape={programFromScrape}
            groupsFor={result => programPrefillGroups(result.program ?? {}, form, lookups)}
            onApply={async (result, groups, importImage) => {
              const next = await applyProgramPrefill(form, result.program ?? {}, groups, lookups, importImage);
              if (isNew && !slugTouched && next.title !== form.title) next.slug = titleToSlug(next.title);
              setForm(next);
              setPrefilled(
                programPrefillGroups(result.program ?? {}, form, lookups)
                  .filter(g => groups.has(g.id))
                  .map(g => g.label.toLowerCase())
              );
            }}
            onClose={() => setPrefillOpen(false)}
          />
        )}
        <SlugChangeConfirmModal isOpen={slugConfirmOpen} onClose={() => setSlugConfirmOpen(false)} onConfirm={performSave} saving={saving} />
        {deleteOpen && (
          <DeleteProgramModal
            programTitle={base.title}
            confirmValue={deleteConfirm}
            onConfirmChange={setDeleteConfirm}
            onDelete={handleDelete}
            onCancel={() => {
              setDeleteOpen(false);
              setDeleteConfirm("");
              setDeleteError(null);
            }}
            loading={deleteLoading}
            error={deleteError}
          />
        )}
      </div>
    </div>
  );
}
