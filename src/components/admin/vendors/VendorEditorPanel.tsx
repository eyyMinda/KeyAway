"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FaExclamationTriangle, FaExternalLinkAlt, FaMagic, FaTimes } from "react-icons/fa";
import { buildVendorPrompt, scrapeToVendorPrefill } from "@/src/lib/prefill/prefillFormat";
import type { ScrapeResult } from "@/src/lib/prefill/scrapePage";
import PrefillDialog from "../programs/prefill/PrefillDialog";
import { applyVendorPrefill, vendorFormToPrefill, vendorPrefillGroups, type VendorPrefillGroup } from "../programs/prefill/applyPrefill";
import { MAX_META_DESC, MAX_META_TITLE, newKey } from "@/src/lib/admin/programFields";
import { validateVendorFields, type VendorFieldError } from "@/src/lib/admin/vendorFields";
import { resolveVendorLogoBackgroundColor } from "@/src/lib/vendors/resolveVendorLogoBackgroundColor";
import { urlFor } from "@/src/sanity/lib/image";
import type { AdminVendorDoc, AdminVendorRow } from "@/src/types/admin";
import ImageLibraryModal from "../programs/ImageLibraryModal";
import { titleToSlug } from "../programs/programSlugUtils";
import { AddRowButton, Card, Field, ItemControls, MarkdownField, TagInput, TextInput, Toggle, inputClass, moveItem } from "../programs/editor/fields";
import ImagePicker from "../programs/editor/ImagePicker";
import { changedVendorFields, vendorDocToForm, vendorFormToFields, type VendorForm } from "./vendorForm";

type LoadResult = { doc: AdminVendorDoc } | { error: string };

const EMPTY_SCRAPE: ScrapeResult = { pages: [], faqs: [], errors: [] };
const vendorFromScrape = (scrape: ScrapeResult) => ({ kind: "vendor" as const, vendor: scrapeToVendorPrefill(scrape) });

async function fetchVendorDoc(id: string): Promise<LoadResult> {
  try {
    const res = await fetch(`/api/v1/admin/vendors/${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data?.error?.message ?? "Failed to load vendor" };
    return { doc: data.data as AdminVendorDoc };
  } catch {
    return { error: "Network error while loading the vendor" };
  }
}

interface VendorEditorPanelProps {
  /** Vendor to edit; `null` creates one. */
  vendorId: string | null;
  onClose: () => void;
  onSaved: (row: AdminVendorRow | null, created: boolean) => void;
  onDeleted: (id: string) => void;
  onOpenProgram: (programId: string) => void;
}

export default function VendorEditorPanel({ vendorId, onClose, onSaved, onDeleted, onOpenProgram }: VendorEditorPanelProps) {
  const isNew = vendorId === null;
  const [doc, setDoc] = useState<AdminVendorDoc | null>(null);
  const [base, setBase] = useState<VendorForm>(() => vendorDocToForm(null));
  const [form, setForm] = useState<VendorForm>(() => vendorDocToForm(null));
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState<VendorFieldError[]>([]);
  const [slugTouched, setSlugTouched] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [library, setLibrary] = useState<((assetId: string) => void) | null>(null);
  const [prefillOpen, setPrefillOpen] = useState(false);

  const applyLoaded = useCallback((result: LoadResult) => {
    if ("error" in result) setLoadError(result.error);
    else {
      const f = vendorDocToForm(result.doc);
      setDoc(result.doc);
      setBase(f);
      setForm(f);
      setLoadError(null);
      setBanner(null);
      setConflict(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!vendorId) return;
    let cancelled = false;
    void fetchVendorDoc(vendorId).then(r => {
      if (!cancelled) applyLoaded(r);
    });
    return () => {
      cancelled = true;
    };
  }, [vendorId, applyLoaded]);

  const reload = () => {
    if (!vendorId) return;
    setLoading(true);
    void fetchVendorDoc(vendorId).then(applyLoaded);
  };

  const changes = useMemo(() => changedVendorFields(base, form), [base, form]);
  const hasChanges = Object.keys(changes).length > 0;
  const errors = useMemo(() => [...validateVendorFields(vendorFormToFields(form)), ...serverErrors], [form, serverErrors]);
  const errorOf = (field: string) => (attempted ? errors.find(e => e.field === field)?.message : undefined);

  const update = (patch: Partial<VendorForm>) => {
    setServerErrors([]);
    if ("slug" in patch) setSlugTouched(true);
    setForm(prev => {
      const next = { ...prev, ...patch };
      if (isNew && !slugTouched && "name" in patch && !("slug" in patch)) next.slug = titleToSlug(patch.name ?? "");
      return next;
    });
  };

  const requestClose = useCallback(() => {
    if (hasChanges && !confirm("Discard unsaved changes?")) return;
    onClose();
  }, [hasChanges, onClose]);

  const rev = doc?._rev;
  const save = useCallback(async () => {
    if (saving || (!isNew && !hasChanges)) return;
    if (validateVendorFields(vendorFormToFields(form)).length) {
      setAttempted(true);
      return;
    }
    setSaving(true);
    setBanner(null);
    try {
      const res = await fetch(isNew ? "/api/v1/admin/vendors" : `/api/v1/admin/vendors/${vendorId}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isNew ? { fields: vendorFormToFields(form) } : { rev, fields: changes })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setConflict(true);
        setBanner(data?.error?.message ?? "This vendor changed since you opened it.");
        return;
      }
      if (!res.ok) {
        setServerErrors((data?.error?.details ?? []).filter((d: VendorFieldError) => d.field));
        setAttempted(true);
        setBanner(data?.error?.message ?? "Failed to save");
        return;
      }
      const saved = data.data as { doc: AdminVendorDoc | null; row: AdminVendorRow | null };
      if (saved.doc) {
        const f = vendorDocToForm(saved.doc);
        setDoc(saved.doc);
        setBase(f);
        setForm(f);
      }
      setAttempted(false);
      setSlugTouched(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
      onSaved(saved.row, isNew);
    } catch {
      setBanner("Network error while saving");
    } finally {
      setSaving(false);
    }
  }, [saving, isNew, hasChanges, form, vendorId, rev, changes, onSaved]);

  const remove = async () => {
    if (!vendorId || !confirm(`Delete vendor "${base.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/v1/admin/vendors/${vendorId}`, { method: "DELETE" });
    if (res.ok) onDeleted(vendorId);
    else setBanner((await res.json().catch(() => ({})))?.error?.message ?? "Failed to delete");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
      } else if (e.key === "Escape") {
        if (library) setLibrary(null);
        else if (prefillOpen) setPrefillOpen(false);
        else requestClose();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [save, requestClose, library, prefillOpen]);

  useEffect(() => {
    if (!hasChanges) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasChanges]);

  const openLibrary = useCallback((onPick: (assetId: string) => void) => setLibrary(() => onPick), []);
  const tileBg = form.bgEnabled ? resolveVendorLogoBackgroundColor({ hex: form.bgHex, alpha: form.bgOpacity / 100, rgb: hexRgb(form.bgHex) }) : undefined;
  const visibleErrors = attempted ? errors : [];
  const programs = doc?.programs ?? [];
  const savedSlug = (doc?.slug as { current?: string } | undefined)?.current;

  return (
    <div className="fixed inset-0 z-200 flex justify-end" role="dialog" aria-modal="true" aria-label={isNew ? "New vendor" : `Edit ${base.name}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-fadeIn" onClick={requestClose} />
      <div className="relative flex h-full w-full max-w-3xl flex-col bg-gray-50 dark:bg-gray-950 shadow-2xl border-l border-gray-200 dark:border-gray-800">
        <header className="shrink-0 flex items-center gap-3 px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <LogoTile assetId={form.logo.assetId} name={form.name} background={tileBg} size="h-11 w-11" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-gray-100">{form.name || (isNew ? "New vendor" : "Untitled")}</h2>
            <div className="flex flex-wrap gap-x-3 text-xs text-gray-500 dark:text-gray-400">
              <span>
                {programs.length} program{programs.length === 1 ? "" : "s"}
              </span>
              {savedSlug && (
                <a href={`/vendors/${savedSlug}`} target="_blank" className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400">
                  View hub page <FaExternalLinkAlt size={9} />
                </a>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPrefillOpen(true)}
            disabled={loading || !!loadError}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20 disabled:opacity-50 cursor-pointer">
            <FaMagic size={12} /> Prefill
          </button>
          <button type="button" onClick={requestClose} aria-label="Close editor" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
            <FaTimes />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl p-5 space-y-5">
            {doc?.hasDraft && (
              <div className="flex gap-3 rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                <FaExclamationTriangle className="mt-0.5 shrink-0" />
                <p>This vendor has unpublished changes in Studio. Publishing that draft later will overwrite edits saved here.</p>
              </div>
            )}
            {banner && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                <span className="flex-1">{banner}</span>
                {conflict && (
                  <button type="button" onClick={reload} className="px-3 py-1 rounded-md bg-red-600 text-white text-xs font-medium cursor-pointer">
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
              <p className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-500/10 p-6 text-center text-sm text-red-700 dark:text-red-300">{loadError}</p>
            ) : (
              <>
                <Card title="Identity">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextInput label="Name" required value={form.name} error={errorOf("name")} placeholder="IObit" onChange={name => update({ name })} />
                    <TextInput
                      label="Slug"
                      required
                      value={form.slug}
                      error={errorOf("slug")}
                      onChange={slug => update({ slug })}
                      hint={`/vendors/${form.slug || "…"}`}
                    />
                  </div>
                  <MarkdownField label="Description" rows={4} value={form.description} onChange={description => update({ description })} hint="Intro copy on the vendor hub page." />
                  <TagInput
                    label="Aliases"
                    values={form.aliases}
                    onChange={aliases => update({ aliases })}
                    placeholder='e.g. "iObit"'
                    hint="Other spellings on giveaway sites, ignored when matching program titles."
                  />
                </Card>

                <Card title="Logo">
                  <div className="flex flex-wrap items-start gap-6">
                    <ImagePicker label="Logo image" value={form.logo} onChange={logo => update({ logo })} onOpenLibrary={openLibrary} />
                    <div className="space-y-3">
                      <Toggle label="Background color" hint="Tile behind transparent logos." checked={form.bgEnabled} onChange={bgEnabled => update({ bgEnabled })} />
                      {form.bgEnabled && (
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={/^#[0-9a-f]{6}$/i.test(form.bgHex) ? form.bgHex : "#ffffff"}
                            onChange={e => update({ bgHex: e.target.value })}
                            className="h-9 w-12 cursor-pointer rounded border border-gray-300 dark:border-gray-700 bg-transparent"
                            aria-label="Background color"
                          />
                          <input value={form.bgHex} onChange={e => update({ bgHex: e.target.value })} className={`${inputClass} w-28 font-mono`} aria-label="Hex color" />
                          <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            Opacity
                            <input type="range" min={0} max={100} value={form.bgOpacity} onChange={e => update({ bgOpacity: Number(e.target.value) })} />
                            <span className="tabular-nums w-8">{form.bgOpacity}%</span>
                          </label>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preview</p>
                      <LogoTile assetId={form.logo.assetId} name={form.name} background={tileBg} size="h-20 w-20" checker />
                    </div>
                  </div>
                </Card>

                <Card title={`Giveaway key vs Official PRO (${form.comparison.length})`} description="Shown on the vendor hub page; applies to every program from this vendor.">
                  {form.comparison.length > 0 && (
                    <div className="space-y-2">
                      <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-0.5">
                        <span>Feature</span>
                        <span>Giveaway key</span>
                        <span>Official PRO</span>
                        <span className="w-[84px]" />
                      </div>
                      {form.comparison.map((row, i) => {
                        const set = (patch: Partial<typeof row>) => update({ comparison: form.comparison.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
                        return (
                          <div key={row._key} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                            <input value={row.feature} placeholder="Auto-updates" aria-label="Feature" onChange={e => set({ feature: e.target.value })} className={`${inputClass} ${errorOf(`giveawayVsOfficial.${i}`) ? "border-red-400" : ""}`} />
                            <input value={row.giveaway} placeholder="Often disabled" aria-label="Giveaway key" onChange={e => set({ giveaway: e.target.value })} className={inputClass} />
                            <input value={row.officialPro} placeholder="Always included" aria-label="Official PRO" onChange={e => set({ officialPro: e.target.value })} className={inputClass} />
                            <ItemControls
                              index={i}
                              count={form.comparison.length}
                              label="row"
                              onMove={to => update({ comparison: moveItem(form.comparison, i, to) })}
                              onRemove={() => update({ comparison: form.comparison.filter((_, j) => j !== i) })}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <AddRowButton
                    label="Add row"
                    onClick={() => update({ comparison: [...form.comparison, { _key: newKey(), feature: "", giveaway: "", officialPro: "" }] })}
                  />
                </Card>

                <Card title="Search appearance" description="Optional overrides for the hub page.">
                  <TextInput label="Meta title" value={form.metaTitle} maxCounter={MAX_META_TITLE} onChange={metaTitle => update({ metaTitle })} />
                  <Field label="Meta description" counter={{ value: form.metaDescription.length, max: MAX_META_DESC }}>
                    <textarea rows={3} value={form.metaDescription} onChange={e => update({ metaDescription: e.target.value })} className={inputClass} />
                  </Field>
                </Card>

                {!isNew && (
                  <Card title={`Programs (${programs.length})`} description="Change a program's vendor in its Basics tab.">
                    {programs.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No programs use this vendor yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {programs.map(p => (
                          <button
                            key={p._id}
                            type="button"
                            onClick={() => onOpenProgram(p._id)}
                            className="px-3 py-1.5 rounded-full text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                            {p.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </Card>
                )}

                {!isNew && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {programs.length ? (
                      "A vendor can be deleted once no program uses it."
                    ) : (
                      <button type="button" onClick={remove} className="underline hover:text-red-600 cursor-pointer">
                        Delete this vendor
                      </button>
                    )}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <footer className="shrink-0 flex flex-wrap items-center gap-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-3">
          <div className="flex-1 min-w-0 text-sm">
            {visibleErrors.length ? (
              <span className="text-red-600 dark:text-red-400">{visibleErrors[0].message}</span>
            ) : savedFlash ? (
              <span className="text-green-600 dark:text-green-400">Saved</span>
            ) : hasChanges ? (
              <span className="text-amber-600 dark:text-amber-400">Unsaved changes</span>
            ) : (
              <span className="text-gray-400">{isNew ? "New vendor" : "No changes"}</span>
            )}
          </div>
          {hasChanges && !isNew && (
            <button
              type="button"
              onClick={() => confirm("Discard all unsaved changes?") && setForm(base)}
              className="px-3 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
              Discard
            </button>
          )}
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || loading || !!loadError || (!isNew && !hasChanges)}
            title="Ctrl+S"
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            {saving ? "Saving…" : isNew ? "Create vendor" : "Save changes"}
          </button>
        </footer>

        {prefillOpen && (
          <PrefillDialog<VendorPrefillGroup>
            kind="vendor"
            buildPrompt={scrape => buildVendorPrompt({ scrape: scrape ?? EMPTY_SCRAPE, current: vendorFormToPrefill(form) })}
            fromScrape={vendorFromScrape}
            groupsFor={result => vendorPrefillGroups(result.vendor ?? {}, form)}
            onApply={async (result, groups, importImage) => {
              const next = await applyVendorPrefill(form, result.vendor ?? {}, groups, importImage);
              if (isNew && !slugTouched && next.name !== form.name) next.slug = titleToSlug(next.name);
              setForm(next);
            }}
            onClose={() => setPrefillOpen(false)}
          />
        )}
        <ImageLibraryModal
          isOpen={!!library}
          onClose={() => setLibrary(null)}
          onSelect={assetId => {
            library?.(assetId);
            setLibrary(null);
          }}
        />
      </div>
    </div>
  );
}

function hexRgb(hex: string): { r: number; g: number; b: number } | undefined {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return undefined;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function LogoTile({
  assetId,
  name,
  background,
  size,
  checker
}: {
  assetId: string | null | undefined;
  name: string;
  background?: string;
  size: string;
  /** Checkerboard behind the tile so transparency is visible. */
  checker?: boolean;
}) {
  return (
    <div
      className={`${size} shrink-0 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 ${checker ? "bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] bg-size-[12px_12px]" : "bg-gray-100 dark:bg-gray-800"}`}>
      <div className="h-full w-full flex items-center justify-center p-1.5" style={background ? { backgroundColor: background } : undefined}>
        {assetId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={urlFor({ _type: "image", asset: { _ref: assetId } }).width(160).fit("max").url()} alt="" className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-lg font-semibold text-gray-400">{name.charAt(0) || "?"}</span>
        )}
      </div>
    </div>
  );
}
