"use client";

import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import SearchInput from "@/src/components/ui/SearchInput";
import { resolveVendorLogoBackgroundColor } from "@/src/lib/vendors/resolveVendorLogoBackgroundColor";
import type { AdminVendorRow } from "@/src/types/admin";
import { LogoTile } from "./VendorEditorPanel";

function vendorGaps(v: AdminVendorRow): string[] {
  const gaps: string[] = [];
  if (!v.logo?.asset?._ref) gaps.push("logo");
  if (!v.hasDescription) gaps.push("description");
  if (!v.comparisonCount) gaps.push("comparison");
  return gaps;
}

interface VendorsViewProps {
  vendors: AdminVendorRow[];
  loading: boolean;
  onOpen: (id: string | null) => void;
}

export default function VendorsView({ vendors, loading, onOpen }: VendorsViewProps) {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const filtered = vendors.filter(v => !q || [v.name, v.slug?.current, ...(v.aliases ?? [])].join(" ").toLowerCase().includes(q));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search vendors…" className="w-full sm:w-72" />
        <button
          type="button"
          onClick={() => onOpen(null)}
          className="ml-auto inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 cursor-pointer">
          <FaPlus size={11} /> New vendor
        </button>
      </div>

      {loading && vendors.length === 0 ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">{q ? "No vendors match." : "No vendors yet."}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(v => {
            const gaps = vendorGaps(v);
            return (
              <button
                key={v._id}
                type="button"
                onClick={() => onOpen(v._id)}
                className="group flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-left transition-colors hover:border-blue-400 dark:hover:border-blue-500/60 cursor-pointer">
                <LogoTile
                  assetId={v.logo?.asset?._ref}
                  name={v.name}
                  background={resolveVendorLogoBackgroundColor(v.logoBackgroundColor)}
                  size="h-14 w-14"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">{v.name}</p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">/vendors/{v.slug?.current ?? "…"}</p>
                  <p className="mt-1 text-xs">
                    <span className="text-gray-600 dark:text-gray-300">
                      {v.programCount} program{v.programCount === 1 ? "" : "s"}
                    </span>
                    <span className="mx-1.5 text-gray-300 dark:text-gray-600">·</span>
                    {gaps.length ? (
                      <span className="text-amber-600 dark:text-amber-400">Missing {gaps.join(", ")}</span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400">Complete</span>
                    )}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
