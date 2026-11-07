"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FaPlus } from "react-icons/fa";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import DrawEditor from "@/src/components/admin/giveaway-picker/DrawEditor";
import { Chip, RelativeDate } from "@/src/components/admin/list/AdminListKit";
import { entrantKey } from "@/src/lib/giveaways/parseGiveawayComments";
import type { GiveawayDraw, GiveawayDrawSummary } from "@/src/types/giveawayDraws";

const TITLE = "Giveaway Picker";
const SUBTITLE = "Facebook giveaways: import the post's comments, draw winners and keep the record.";

function GiveawayPickerContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");
  const [draws, setDraws] = useState<GiveawayDrawSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const select = useCallback(
    (id: string | null) => router.replace(id ? `${pathname}?id=${id}` : pathname, { scroll: false }),
    [pathname, router]
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/admin/giveaway-draws")
      .then(res => (res.ok ? res.json() : Promise.reject(new Error("Could not load giveaways"))))
      .then((json: { data: GiveawayDrawSummary[] }) => !cancelled && setDraws(json.data))
      .catch(e => !cancelled && setError(e instanceof Error ? e.message : "Could not load giveaways"));
    return () => {
      cancelled = true;
    };
  }, []);

  /** Wins per person in every giveaway except the open one, for "won before" flags. */
  const pastWins = useMemo(() => {
    const wins = new Map<string, number>();
    for (const draw of draws ?? []) {
      if (draw.id === selectedId) continue;
      for (const winner of draw.winners)
        wins.set(entrantKey(winner.name), (wins.get(entrantKey(winner.name)) ?? 0) + 1);
    }
    return wins;
  }, [draws, selectedId]);

  const create = async () => {
    setCreating(true);
    setError(null);
    try {
      const month = new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" });
      const res = await fetch("/api/v1/admin/giveaway-draws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Giveaway ${month}`, kind: "Comment to win" })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not create the giveaway");
      const draw = json.data as GiveawayDraw;
      setDraws(prev => [toSummary(draw), ...(prev ?? [])]);
      select(draw.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the giveaway");
    } finally {
      setCreating(false);
    }
  };

  const onSaved = useCallback((draw: GiveawayDraw) => {
    setDraws(prev => prev?.map(d => (d.id === draw.id ? toSummary(draw) : d)) ?? prev);
  }, []);

  const onDeleted = () => {
    setDraws(prev => prev?.filter(d => d.id !== selectedId) ?? prev);
    select(null);
  };

  return (
    <ProtectedAdminLayout title={TITLE} subtitle={SUBTITLE}>
      {error && (
        <p role="alert" className="mb-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-2 lg:sticky lg:top-4 lg:self-start">
          <button
            type="button"
            disabled={creating}
            onClick={() => void create()}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
            <FaPlus className="h-3 w-3" /> New giveaway
          </button>
          {draws === null ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Loading…</p>
          ) : draws.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No giveaways yet.</p>
          ) : (
            <ul className="space-y-2">
              {draws.map(draw => (
                <li key={draw.id}>
                  <button
                    type="button"
                    onClick={() => select(draw.id)}
                    aria-current={draw.id === selectedId}
                    className={`w-full cursor-pointer rounded-xl border px-3.5 py-3 text-left transition-colors ${
                      draw.id === selectedId
                        ? "border-primary-500 bg-primary-50/60 dark:bg-primary-500/10"
                        : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
                    }`}>
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {draw.title}
                      </span>
                      <span className="ml-auto shrink-0">
                        {draw.status === "drawn" ? <Chip tone="green">Drawn</Chip> : <Chip tone="blue">Open</Chip>}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-gray-500 dark:text-gray-400">
                      {draw.kind ? `${draw.kind} · ` : ""}
                      <RelativeDate iso={draw.createdAt} />
                    </span>
                    <span className="mt-1 block text-xs tabular-nums text-gray-600 dark:text-gray-300">
                      {draw.entrantCount} entrants · {draw.prizeCount} prizes · {draw.winners.length} winners
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="min-w-0">
          {selectedId ? (
            <DrawEditor
              key={selectedId}
              drawId={selectedId}
              pastWins={pastWins}
              onSaved={onSaved}
              onDeleted={onDeleted}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Pick a giveaway or start a new one.
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Add the prizes, paste the post&apos;s comments, then draw. Winners stay on record for future giveaways.
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedAdminLayout>
  );
}

function toSummary(draw: GiveawayDraw): GiveawayDrawSummary {
  return {
    id: draw.id,
    title: draw.title,
    kind: draw.kind,
    status: draw.status,
    createdAt: draw.createdAt,
    drawnAt: draw.drawnAt,
    winners: draw.winners,
    entrantCount: draw.entrants.length,
    prizeCount: draw.prizes.length
  };
}

export default function GiveawayPickerPage() {
  return (
    <Suspense
      fallback={
        <ProtectedAdminLayout title={TITLE} subtitle={SUBTITLE}>
          {null}
        </ProtectedAdminLayout>
      }>
      <GiveawayPickerContent />
    </Suspense>
  );
}
