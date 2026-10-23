"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import FeaturedProgramSettings from "@/src/components/admin/programs/FeaturedProgramSettings";
import ProgramEditorPanel from "@/src/components/admin/programs/editor/ProgramEditorPanel";
import type { EditorLookups } from "@/src/components/admin/programs/editor/types";
import ProgramsTableView, { hasNewVersion } from "@/src/components/admin/programs/ProgramsTableView";
import VersionsView from "@/src/components/admin/programs/VersionsView";
import VendorEditorPanel from "@/src/components/admin/vendors/VendorEditorPanel";
import VendorsView from "@/src/components/admin/vendors/VendorsView";
import type { ProgramEditorTab } from "@/src/lib/admin/programFields";
import type { AdminProgramRow, AdminVendorRow } from "@/src/types/admin";

type PageData = { programs: AdminProgramRow[]; vendors: AdminVendorRow[]; categories: EditorLookups["categories"] };

/** Programs and vendors (light rows) plus the category options, in one request. */
async function loadPage(): Promise<PageData | null> {
  try {
    const res = await fetch("/api/v1/admin/programs");
    if (!res.ok) return null;
    return ((await res.json()) as { data: PageData }).data;
  } catch (error) {
    console.error("Error fetching programs:", error);
    return null;
  }
}

type View = "programs" | "vendors" | "versions";

/**
 * Page state lives in the URL so refresh and back/forward work:
 * `?view=vendors`, `?edit=<programId>&tab=keys`, `?new=1`, `?vendor=<vendorId>` / `?vendor=new`.
 */
interface UrlState {
  view: View;
  program: { id: string | null; tab: ProgramEditorTab } | null;
  /** Vendor being edited; `null` id = new vendor. */
  vendor: { id: string | null } | null;
}

function readUrlState(): UrlState {
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get("view");
  const view: View = viewParam === "vendors" || viewParam === "versions" ? viewParam : "programs";
  const tab = (params.get("tab") as ProgramEditorTab | null) ?? "basics";
  const editId = params.get("edit");
  const vendorParam = params.get("vendor");
  return {
    view,
    program: params.get("new") === "1" ? { id: null, tab } : editId ? { id: editId, tab } : null,
    vendor: vendorParam ? { id: vendorParam === "new" ? null : vendorParam } : null
  };
}

function writeUrlState(state: UrlState, replace = false) {
  const url = new URL(window.location.href);
  for (const key of ["view", "edit", "new", "tab", "vendor"]) url.searchParams.delete(key);
  if (state.view !== "programs") url.searchParams.set("view", state.view);
  if (state.program) {
    if (state.program.id) url.searchParams.set("edit", state.program.id);
    else url.searchParams.set("new", "1");
    if (state.program.tab !== "basics") url.searchParams.set("tab", state.program.tab);
  }
  if (state.vendor) url.searchParams.set("vendor", state.vendor.id ?? "new");
  window.history[replace ? "replaceState" : "pushState"](null, "", url);
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<AdminProgramRow[]>([]);
  const [vendors, setVendors] = useState<AdminVendorRow[]>([]);
  const [categories, setCategories] = useState<EditorLookups["categories"]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // The admin layout renders a spinner until the session check finishes, so reading the URL here is hydration-safe.
  const [ui, setUi] = useState<UrlState>(() =>
    typeof window === "undefined" ? { view: "programs", program: null, vendor: null } : readUrlState()
  );

  const applyPage = useCallback((data: PageData | null) => {
    if (data) {
      setPrograms(data.programs ?? []);
      setVendors(data.vendors ?? []);
      setCategories(data.categories ?? []);
      setLoadError(null);
    } else {
      setLoadError("Failed to load programs");
    }
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    void loadPage().then(applyPage);
  }, [applyPage]);

  useEffect(() => {
    let cancelled = false;
    void loadPage().then(data => {
      if (!cancelled) applyPage(data);
    });
    const onPop = () => setUi(readUrlState());
    window.addEventListener("popstate", onPop);
    return () => {
      cancelled = true;
      window.removeEventListener("popstate", onPop);
    };
  }, [applyPage]);

  const navigate = (next: Partial<UrlState>, replace = false) => {
    setUi(prev => {
      const state = { ...prev, ...next };
      writeUrlState(state, replace);
      return state;
    });
  };

  const openProgram = (id: string | null, tab: ProgramEditorTab = "basics") => navigate({ program: { id, tab }, vendor: null });
  const lookups: EditorLookups = { vendors, categories };
  const upsert = <T extends { _id: string }>(list: T[], row: T) =>
    list.some(r => r._id === row._id) ? list.map(r => (r._id === row._id ? row : r)) : [...list, row];

  const newVersions = programs.filter(hasNewVersion).length;
  const tabs: { id: View; label: string; count?: number; badge?: number }[] = [
    { id: "programs", label: "Programs", count: programs.length },
    { id: "vendors", label: "Vendors", count: vendors.length },
    { id: "versions", label: "Versions", badge: newVersions }
  ];

  return (
    <ProtectedAdminLayout title="Programs" subtitle="Find programs, manage their keys, vendors and versions">
      <div className="mb-5 inline-flex rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1" role="tablist">
        {tabs.map(t => {
          const active = ui.view === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => navigate({ view: t.id })}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                active
                  ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}>
              {t.label}
              {t.count !== undefined && <span className="text-xs tabular-nums opacity-60">{t.count}</span>}
              {!!t.badge && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-semibold text-white">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Kept mounted (hidden) so filters and "show more" survive tab switches. */}
      <div hidden={ui.view !== "programs"}>
        <ProgramsTableView
          programs={programs}
          lookups={lookups}
          loading={loading}
          loadError={loadError}
          onRefresh={refresh}
          onOpen={openProgram}
          onShowVersions={() => navigate({ view: "versions" })}
        />
        <div className="mt-6">
          <FeaturedProgramSettings programs={programs} onProgramClick={program => openProgram(program._id)} />
        </div>
      </div>

      {ui.view === "vendors" && <VendorsView vendors={vendors} loading={loading} onOpen={id => navigate({ vendor: { id }, program: null })} />}

      {ui.view === "versions" && (
        <VersionsView
          programs={programs}
          onOpen={openProgram}
          onRefresh={refresh}
          onRowChange={(id, change) => setPrograms(prev => prev.map(p => (p._id === id ? { ...p, ...change } : p)))}
        />
      )}

      {ui.program && (
        <ProgramEditorPanel
          key={ui.program.id ?? "new"}
          programId={ui.program.id}
          tab={ui.program.tab}
          onTabChange={tab => navigate({ program: { id: ui.program!.id, tab } }, true)}
          lookups={lookups}
          onClose={() => navigate({ program: null })}
          onSaved={(row, created) => {
            if (row) setPrograms(prev => upsert(prev, row));
            if (created && row) navigate({ program: { id: row._id, tab: ui.program!.tab } }, true);
          }}
          onDeleted={id => {
            setPrograms(prev => prev.filter(p => p._id !== id));
            navigate({ program: null });
          }}
        />
      )}

      {ui.vendor && (
        <VendorEditorPanel
          key={ui.vendor.id ?? "new"}
          vendorId={ui.vendor.id}
          onClose={() => navigate({ vendor: null })}
          onSaved={(row, created) => {
            if (row) setVendors(prev => upsert(prev, row).sort((a, b) => a.name.localeCompare(b.name)));
            if (created && row) navigate({ vendor: { id: row._id } }, true);
            // Vendor names show on program rows.
            if (row && !created) setPrograms(prev => prev.map(p => (p.vendor?._id === row._id ? { ...p, vendor: { _id: row._id, name: row.name } } : p)));
          }}
          onDeleted={id => {
            setVendors(prev => prev.filter(v => v._id !== id));
            navigate({ vendor: null });
          }}
          onOpenProgram={id => openProgram(id)}
        />
      )}
    </ProtectedAdminLayout>
  );
}
