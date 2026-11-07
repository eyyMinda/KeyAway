"use client";

/** @fileoverview Dashboard card: latest Facebook giveaway draws, linking to the giveaway picker. */
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaGift } from "react-icons/fa";
import { Chip, RelativeDate } from "@/src/components/admin/list/AdminListKit";
import type { GiveawayDrawSummary } from "@/src/types/giveawayDraws";

const SHOWN = 3;

export default function GiveawayPickerCard() {
  const [draws, setDraws] = useState<GiveawayDrawSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/admin/giveaway-draws")
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then((json: { data: GiveawayDrawSummary[] }) => !cancelled && setDraws(json.data))
      .catch(() => !cancelled && setDraws([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const open = draws?.filter(d => d.status === "open").length ?? 0;
  const winners = draws?.reduce((n, d) => n + d.winners.length, 0) ?? 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-soft dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex flex-wrap items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-300">
          <FaGift className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Giveaway Picker</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {draws === null ? "Loading…" : `${draws.length} giveaways · ${open} open · ${winners} winners on record`}
          </p>
        </div>
        <Link
          href="/admin/giveaway-picker"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
          Open picker
        </Link>
      </div>

      {draws && draws.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
          {draws.slice(0, SHOWN).map(draw => (
            <li key={draw.id}>
              <Link
                href={`/admin/giveaway-picker?id=${draw.id}`}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {draw.title}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {draw.entrantCount} entrants · {draw.winners.length} winners · <RelativeDate iso={draw.createdAt} />
                  </span>
                </span>
                {draw.status === "drawn" ? <Chip tone="green">Drawn</Chip> : <Chip tone="blue">Open</Chip>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
