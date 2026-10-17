"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import KeySuggestionsTable from "@/src/components/admin/key-suggestions/KeySuggestionsTable";
import {
  AdminFilterBar,
  AdminSearch,
  AdminSelect,
  programOptions,
  usePagedList
} from "@/src/components/admin/list/AdminListKit";
import { KeySuggestion } from "@/src/types/contact";
import { client } from "@/src/sanity/lib/client";

type StatusView = "open" | KeySuggestion["status"] | "all";
type SortKey = "newest" | "oldest" | "program";

/** Open = still needs a decision. Added / rejected leave the default view like resolved giveaway finds. */
const OPEN: KeySuggestion["status"][] = ["new", "reviewing"];

/** Suggestions name programs as free text; group case-insensitively. */
const programKey = (s: KeySuggestion) => s.programName.trim().toLowerCase();

async function loadSuggestions(): Promise<KeySuggestion[] | null> {
  try {
    return await client.fetch<KeySuggestion[]>(
      `*[_type == "keySuggestion"] | order(createdAt desc) {
        _id, _createdAt, cdKey, programName, programVersion, programLink, name, email, message, status, ipHash, createdAt
      }`
    );
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return null;
  }
}

export default function KeySuggestionsPage() {
  const [suggestions, setSuggestions] = useState<KeySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusView>("open");
  const [program, setProgram] = useState("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const fetchSuggestions = () =>
    loadSuggestions().then(result => {
      if (result) setSuggestions(result);
      setLoading(false);
    });

  useEffect(() => {
    let cancelled = false;
    loadSuggestions().then(result => {
      if (cancelled) return;
      if (result) setSuggestions(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const countOf = (s: KeySuggestion["status"]) => suggestions.filter(x => x.status === s).length;
  const statusOptions = [
    { value: "open", label: "Open", count: suggestions.filter(s => OPEN.includes(s.status)).length },
    { value: "new", label: "New", count: countOf("new") },
    { value: "reviewing", label: "Reviewing", count: countOf("reviewing") },
    { value: "added", label: "Added", count: countOf("added") },
    { value: "rejected", label: "Rejected", count: countOf("rejected") },
    { value: "all", label: "All", count: suggestions.length }
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = suggestions.filter(s => {
      if (status === "open" ? !OPEN.includes(s.status) : status !== "all" && s.status !== status) return false;
      if (program !== "all" && programKey(s) !== program) return false;
      if (!q) return true;
      return [s.programName, s.cdKey, s.programVersion, s.name, s.email, s.message].some(v =>
        v?.toLowerCase().includes(q)
      );
    });
    return list.sort((a, b) => {
      if (sort === "program") return a.programName.localeCompare(b.programName);
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sort === "oldest" ? diff : -diff;
    });
  }, [suggestions, search, status, program, sort]);

  const paged = usePagedList(filtered, `${search}|${status}|${program}|${sort}`);

  return (
    <ProtectedAdminLayout title="Key Suggestions" subtitle="Keys visitors suggested for programs">
      <AdminFilterBar>
        <AdminSearch
          value={search}
          onChange={setSearch}
          placeholder="Search program, key, name or email…"
          className="sm:flex-1 sm:min-w-64"
        />
        <AdminSelect label="Status" value={status} onChange={v => setStatus(v as StatusView)} options={statusOptions} />
        <AdminSelect
          label="Program"
          value={program}
          onChange={setProgram}
          options={programOptions(suggestions.map(s => ({ key: programKey(s), label: s.programName.trim() })))}
          className="sm:max-w-64"
        />
        <AdminSelect
          label="Sort"
          value={sort}
          onChange={v => setSort(v as SortKey)}
          options={[
            { value: "newest", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
            { value: "program", label: "Program A–Z" }
          ]}
        />
      </AdminFilterBar>

      <KeySuggestionsTable
        suggestions={paged.pageItems}
        all={suggestions}
        total={filtered.length}
        loading={loading}
        paging={paged}
        onUpdate={fetchSuggestions}
      />
    </ProtectedAdminLayout>
  );
}
