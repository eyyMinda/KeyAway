"use client";

import { useMemo } from "react";
import type { ArrayOfObjectsInputProps } from "sanity";

type CdKeyRow = {
  _key?: string;
  status?: string;
  createdAt?: string;
};

/** Studio list order: new → active → limit → expired, then newest `createdAt` first within each group. */
function statusRank(status: string | undefined): number {
  const s = (status ?? "").toLowerCase().trim();
  const map: Record<string, number> = {
    new: 0,
    active: 1,
    limit: 2,
    limit_reached: 2,
    expired: 3
  };
  return map[s] ?? 99;
}

function createdAtMs(row: CdKeyRow | undefined): number {
  if (!row?.createdAt) return 0;
  const t = new Date(row.createdAt).getTime();
  return Number.isFinite(t) ? t : 0;
}

function compareCdKeys(a: CdKeyRow, b: CdKeyRow): number {
  const ra = statusRank(a.status);
  const rb = statusRank(b.status);
  if (ra !== rb) return ra - rb;
  return createdAtMs(b) - createdAtMs(a);
}

export function CdKeysArrayInput(props: ArrayOfObjectsInputProps) {
  const { members, value, renderDefault } = props;

  const sortedMembers = useMemo(() => {
    if (!members?.length) return members;
    const rows = (Array.isArray(value) ? value : []) as CdKeyRow[];
    const sortedKeys = [...rows].sort(compareCdKeys).map(r => r._key).filter(Boolean) as string[];
    const byKey = Object.fromEntries(members.map(m => [m.key, m]));
    const ordered = sortedKeys.map(k => byKey[k]).filter(Boolean);
    if (ordered.length !== members.length) return members;
    return ordered;
  }, [members, value]);

  return renderDefault({ ...props, members: sortedMembers });
}
