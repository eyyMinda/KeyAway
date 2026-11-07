"use client";

/**
 * @fileoverview One Facebook giveaway: details, prizes, entrants (imported from the post's comments) and the draw.
 * Picks are saved immediately together with any other change, so the winner record is never lost.
 */
import { useEffect, useMemo, useState } from "react";
import { FaCopy, FaDice, FaExternalLinkAlt, FaPlus, FaRedo, FaTrash, FaTrophy } from "react-icons/fa";
import { AdminSearch, Chip, RelativeDate } from "@/src/components/admin/list/AdminListKit";
import { entrantKey } from "@/src/lib/giveaways/parseGiveawayComments";
import { drawPool, pickWinner, type PickOptions } from "@/src/lib/giveaways/pickWinner";
import type { DrawEntrant, DrawPrize, DrawWinner, GiveawayDraw } from "@/src/types/giveawayDraws";
import EntrantImport from "./EntrantImport";
import { PrizeToggles } from "./PrizeToggles";
import WinnerMessages from "./WinnerMessages";

export const GIVEAWAY_KINDS = ["Comment to win", "Holiday", "Milestone", "Partner giveaway", "Quiz"];

const ENTRANT_PAGE = 100;
const card = "rounded-xl border border-gray-200 bg-white shadow-soft dark:border-gray-800 dark:bg-gray-900";
const input =
  "h-9 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";
const ghostButton =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800";
const primaryButton =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50";

type Draft = Pick<GiveawayDraw, "title" | "kind" | "postUrl" | "notes" | "prizes" | "entrants" | "winners" | "status">;

const draftOf = (draw: GiveawayDraw): Draft => ({
  title: draw.title,
  kind: draw.kind,
  postUrl: draw.postUrl,
  notes: draw.notes,
  prizes: draw.prizes,
  entrants: draw.entrants,
  winners: draw.winners,
  status: draw.status
});

const newPrizeId = () => `p${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;

/** Adds imported people; someone already entered keeps one row with the prizes merged. */
function mergeEntrants(current: DrawEntrant[], incoming: DrawEntrant[]): DrawEntrant[] {
  const byKey = new Map(current.map(e => [entrantKey(e.n), { ...e, p: [...e.p] }]));
  for (const entrant of incoming) {
    const key = entrantKey(entrant.n);
    const found = byKey.get(key);
    if (found) found.p = [...new Set([...found.p, ...entrant.p])];
    else byKey.set(key, entrant);
  }
  return [...byKey.values()];
}

function Section({
  title,
  meta,
  actions,
  children
}: {
  title: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={card}>
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-800 sm:px-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {meta && <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">{meta}</span>}
        {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export default function DrawEditor({
  drawId,
  pastWins,
  onSaved,
  onDeleted
}: {
  drawId: string;
  /** Wins per person in other giveaways (by entrant key). */
  pastWins: Map<string, number>;
  onSaved: (draw: GiveawayDraw) => void;
  onDeleted: () => void;
}) {
  const [draw, setDraw] = useState<GiveawayDraw | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [manualName, setManualName] = useState("");
  const [search, setSearch] = useState("");
  const [sortAz, setSortAz] = useState(false);
  const [entrantLimit, setEntrantLimit] = useState(ENTRANT_PAGE);
  const [comments, setComments] = useState<Map<string, string>>(new Map());
  const [options, setOptions] = useState<PickOptions>({ preferNewInDraw: true, avoidPastWinners: false });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/admin/giveaway-draws/${drawId}`)
      .then(res => (res.ok ? res.json() : Promise.reject(new Error("Could not load the giveaway"))))
      .then((json: { data: GiveawayDraw }) => {
        if (cancelled) return;
        setDraw(json.data);
        setDraft(draftOf(json.data));
      })
      .catch(e => !cancelled && setError(e instanceof Error ? e.message : "Could not load the giveaway"));
    return () => {
      cancelled = true;
    };
  }, [drawId]);

  const dirty = useMemo(
    () => Boolean(draw && draft && JSON.stringify(draftOf(draw)) !== JSON.stringify(draft)),
    [draw, draft]
  );
  const pastWinnerKeys = useMemo(() => new Set(pastWins.keys()), [pastWins]);

  if (error && !draft) return <p className="py-12 text-center text-sm text-red-700 dark:text-red-300">{error}</p>;
  if (!draw || !draft)
    return <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">Loading giveaway…</p>;

  const set = (next: Partial<Draft>) => setDraft(prev => (prev ? { ...prev, ...next } : prev));

  const save = async (next: Draft = draft) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/giveaway-draws/${drawId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not save");
      setDraw(json.data);
      setDraft(draftOf(json.data));
      onSaved(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${draw.title}" and its winner record? This cannot be undone.`)) return;
    const res = await fetch(`/api/v1/admin/giveaway-draws/${drawId}`, { method: "DELETE" });
    if (res.ok) onDeleted();
    else setError("Could not delete the giveaway");
  };

  // Prizes ---------------------------------------------------------------------------------------------------
  const updatePrize = (id: string, next: Partial<DrawPrize>) =>
    set({ prizes: draft.prizes.map(p => (p.id === id ? { ...p, ...next } : p)) });
  const addPrize = () => set({ prizes: [...draft.prizes, { id: newPrizeId(), name: "", qty: 1, aliases: [] }] });
  const removePrize = (id: string) =>
    set({
      prizes: draft.prizes.filter(p => p.id !== id),
      entrants: draft.entrants.map(e => ({ ...e, p: e.p.filter(p => p !== id) }))
    });

  // Entrants -------------------------------------------------------------------------------------------------
  const addImported = (incoming: DrawEntrant[], incomingComments: Map<string, string>) => {
    set({ entrants: mergeEntrants(draft.entrants, incoming) });
    setComments(prev => new Map([...prev, ...incomingComments]));
    setImporting(false);
  };
  const addManual = () => {
    const name = manualName.trim();
    if (!name) return;
    set({ entrants: mergeEntrants(draft.entrants, [{ n: name, p: [] }]) });
    setManualName("");
  };
  const setEntrantPrizes = (key: string, p: string[]) =>
    set({ entrants: draft.entrants.map(e => (entrantKey(e.n) === key ? { ...e, p } : e)) });
  const removeEntrant = (key: string) => set({ entrants: draft.entrants.filter(e => entrantKey(e.n) !== key) });

  const q = search.trim().toLowerCase();
  const shownEntrants = draft.entrants
    .filter(e => !q || e.n.toLowerCase().includes(q))
    .sort((a, b) => (sortAz ? a.n.localeCompare(b.n) : 0));
  const unmatched = draft.entrants.filter(e => e.p.length === 0).length;

  // Draw -----------------------------------------------------------------------------------------------------
  const pick = (prizeId: string) => {
    const winner = pickWinner(prizeId, draft.entrants, draft.winners, pastWinnerKeys, options);
    if (!winner) return;
    const comment = comments.get(entrantKey(winner.n));
    const winners: DrawWinner[] = [
      ...draft.winners,
      {
        prize: prizeId,
        name: winner.n,
        at: new Date().toISOString(),
        ...(comment ? { comment: comment.slice(0, 280) } : {})
      }
    ];
    void save({ ...draft, winners });
  };
  const dropWinner = (index: number, redraw: boolean) => {
    const removed = draft.winners[index];
    const winners = draft.winners.filter((_, i) => i !== index);
    if (!redraw) return void save({ ...draft, winners });
    // A redraw leaves the previous winner out of this prize's pool.
    const entrants = draft.entrants.filter(e => entrantKey(e.n) !== entrantKey(removed.name));
    const next = pickWinner(removed.prize, entrants, winners, pastWinnerKeys, options);
    void save({
      ...draft,
      winners: next ? [...winners, { prize: removed.prize, name: next.n, at: new Date().toISOString() }] : winners
    });
  };

  const prizeName = (id: string) => draft.prizes.find(p => p.id === id)?.name ?? "Removed prize";
  const announcement = [
    `🎉 ${draft.title} winners`,
    // Same shape as the winners post: "Prize - KEY", then one winner per line.
    ...draft.prizes
      .map(p => [p, draft.winners.filter(w => w.prize === p.id).map(w => w.name)] as const)
      .filter(([, names]) => names.length)
      .map(([prize, names]) => [`${prize.name}${prize.key ? ` - ${prize.key}` : ""}`, ...names].join("\n"))
  ].join("\n\n");

  const copyAnnouncement = async () => {
    await navigator.clipboard.writeText(announcement);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5 pb-20">
      <Section
        title="Details"
        meta={
          <>
            Created <RelativeDate iso={draw.createdAt} />
          </>
        }
        actions={
          <>
            {draft.status === "drawn" ? <Chip tone="green">Drawn</Chip> : <Chip tone="blue">Open</Chip>}
            <button type="button" onClick={() => void remove()} className={`${ghostButton} hover:text-red-600`}>
              <FaTrash className="h-3 w-3" /> Delete
            </button>
          </>
        }>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
            Title
            <input className={`${input} mt-1`} value={draft.title} onChange={e => set({ title: e.target.value })} />
          </label>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
            Type
            <input
              className={`${input} mt-1`}
              list="giveaway-kinds"
              value={draft.kind ?? ""}
              placeholder="e.g. Holiday"
              onChange={e => set({ kind: e.target.value || undefined })}
            />
            <datalist id="giveaway-kinds">
              {GIVEAWAY_KINDS.map(kind => (
                <option key={kind} value={kind} />
              ))}
            </datalist>
          </label>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 sm:col-span-2">
            Facebook post
            <span className="mt-1 flex gap-2">
              <input
                className={input}
                value={draft.postUrl ?? ""}
                placeholder="https://www.facebook.com/groups/…/posts/…"
                onChange={e => set({ postUrl: e.target.value || undefined })}
              />
              {draft.postUrl && (
                <a
                  href={draft.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={ghostButton}
                  aria-label="Open post">
                  <FaExternalLinkAlt className="h-3 w-3" />
                </a>
              )}
            </span>
          </label>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 sm:col-span-2">
            Notes / rules
            <textarea
              rows={2}
              value={draft.notes ?? ""}
              placeholder="e.g. one prize per person, winners announced Friday"
              onChange={e => set({ notes: e.target.value || undefined })}
              className={`${input} mt-1 h-auto resize-y py-2`}
            />
          </label>
        </div>
      </Section>

      <Section
        title="Prizes"
        meta={`${draft.prizes.length} ${draft.prizes.length === 1 ? "prize" : "prizes"}`}
        actions={
          <button type="button" onClick={addPrize} className={ghostButton}>
            <FaPlus className="h-3 w-3" /> Add prize
          </button>
        }>
        {draft.prizes.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add the prizes first; comments are matched against them.
          </p>
        ) : (
          <ul className="space-y-2">
            {draft.prizes.map(prize => {
              const hasWinners = draft.winners.some(w => w.prize === prize.id);
              return (
                <li
                  key={prize.id}
                  className="grid grid-cols-[1fr_4.5rem_auto] gap-2 sm:grid-cols-[minmax(0,1.3fr)_4.5rem_minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <input
                    className={input}
                    value={prize.name}
                    placeholder="Advanced SystemCare Pro"
                    aria-label="Prize name"
                    onChange={e => updatePrize(prize.id, { name: e.target.value })}
                  />
                  <input
                    className={input}
                    type="number"
                    min={1}
                    max={100}
                    value={prize.qty}
                    aria-label="Winners for this prize"
                    title="Winners for this prize"
                    onChange={e => updatePrize(prize.id, { qty: Math.max(1, Number(e.target.value) || 1) })}
                  />
                  <input
                    className={`${input} col-span-2 font-mono sm:col-span-1`}
                    value={prize.key ?? ""}
                    placeholder="Key for the winners"
                    aria-label="Prize key"
                    onChange={e => updatePrize(prize.id, { key: e.target.value || undefined })}
                  />
                  <input
                    className={`${input} col-span-2 sm:col-span-1`}
                    value={prize.aliases.join(", ")}
                    placeholder="Also matches: ASC, systemcare"
                    aria-label="Other words for this prize"
                    onChange={e =>
                      updatePrize(prize.id, { aliases: e.target.value.split(",").map(a => a.trimStart()) })
                    }
                  />
                  <button
                    type="button"
                    disabled={hasWinners}
                    title={hasWinners ? "Remove its winners first" : "Remove prize"}
                    onClick={() => removePrize(prize.id)}
                    className="row-start-1 col-start-3 cursor-pointer rounded-lg px-2 text-gray-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 sm:col-start-5">
                    <FaTrash className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section
        title="Entrants"
        meta={
          <>
            {draft.entrants.length.toLocaleString()} entered
            {unmatched > 0 && (
              <span className="text-amber-700 dark:text-amber-300"> · {unmatched} without a prize</span>
            )}
          </>
        }
        actions={
          <button
            type="button"
            disabled={!draft.prizes.length}
            onClick={() => setImporting(true)}
            className={primaryButton}>
            Import comments
          </button>
        }>
        {importing && (
          <div className="mb-4">
            <EntrantImport
              prizes={draft.prizes}
              existing={draft.entrants}
              onAdd={addImported}
              onCancel={() => setImporting(false)}
            />
          </div>
        )}
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <AdminSearch value={search} onChange={setSearch} placeholder="Find an entrant…" className="sm:flex-1" />
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={sortAz}
              onChange={e => setSortAz(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            A–Z
          </label>
          <span className="flex gap-2">
            <input
              className={`${input} sm:w-48`}
              value={manualName}
              placeholder="Add a name"
              onChange={e => setManualName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addManual()}
            />
            <button type="button" onClick={addManual} disabled={!manualName.trim()} className={ghostButton}>
              Add
            </button>
          </span>
        </div>
        {draft.entrants.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            No entrants yet. Import the post&apos;s comments.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {shownEntrants.slice(0, entrantLimit).map(entrant => {
              const key = entrantKey(entrant.n);
              const won = draft.winners.filter(w => entrantKey(w.name) === key);
              const past = pastWins.get(key) ?? 0;
              return (
                <li
                  key={key}
                  className={`flex flex-col gap-1.5 px-3 py-2 sm:flex-row sm:items-center ${entrant.p.length ? "" : "bg-amber-50/60 dark:bg-amber-500/5"}`}>
                  <span className="flex min-w-0 items-center gap-1.5 sm:w-60 sm:shrink-0">
                    <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{entrant.n}</span>
                    {won.length > 0 && (
                      <Chip tone="green">
                        <FaTrophy className="mr-0.5 h-2.5 w-2.5" /> {won.length}
                      </Chip>
                    )}
                    {past > 0 && <Chip tone="purple">Won before ×{past}</Chip>}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                    <PrizeToggles prizes={draft.prizes} selected={entrant.p} onChange={p => setEntrantPrizes(key, p)} />
                    <button
                      type="button"
                      onClick={() => removeEntrant(key)}
                      aria-label={`Remove ${entrant.n}`}
                      className="ml-auto cursor-pointer rounded px-1.5 text-gray-400 hover:text-red-600">
                      <FaTrash className="h-3 w-3" />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {shownEntrants.length > entrantLimit && (
          <button
            type="button"
            onClick={() => setEntrantLimit(n => n + ENTRANT_PAGE)}
            className="mt-2 w-full cursor-pointer rounded-lg py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
            Show more ({(shownEntrants.length - entrantLimit).toLocaleString()} left)
          </button>
        )}
      </Section>

      <Section
        title="Draw"
        meta={`${draft.winners.length} ${draft.winners.length === 1 ? "winner" : "winners"}`}
        actions={
          draft.status === "drawn" ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => void save({ ...draft, status: "open" })}
              className={ghostButton}>
              Reopen
            </button>
          ) : (
            <button
              type="button"
              disabled={saving || !draft.winners.length}
              onClick={() => void save({ ...draft, status: "drawn" })}
              className={ghostButton}>
              Mark as drawn
            </button>
          )
        }>
        <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={options.preferNewInDraw}
              onChange={e => setOptions(o => ({ ...o, preferNewInDraw: e.target.checked }))}
              className="h-4 w-4 rounded"
            />
            Prefer people without a prize in this giveaway
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={options.avoidPastWinners}
              onChange={e => setOptions(o => ({ ...o, avoidPastWinners: e.target.checked }))}
              className="h-4 w-4 rounded"
            />
            Prefer people who never won before
          </label>
        </div>

        <ul className="space-y-3">
          {draft.prizes.map(prize => {
            const prizeWinners = draft.winners.map((w, i) => ({ ...w, index: i })).filter(w => w.prize === prize.id);
            const pool = drawPool(prize.id, draft.entrants, draft.winners, pastWinnerKeys, options);
            const full = prizeWinners.length >= prize.qty;
            return (
              <li key={prize.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{prize.name || "Unnamed prize"}</span>
                  <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                    {prizeWinners.length}/{prize.qty} picked ·{" "}
                    {draft.entrants.filter(e => e.p.includes(prize.id)).length} entered · {pool.length} in the draw
                  </span>
                  <button
                    type="button"
                    disabled={saving || full || !pool.length}
                    onClick={() => pick(prize.id)}
                    className={`${primaryButton} ml-auto`}>
                    <FaDice className="h-3.5 w-3.5" /> Pick winner
                  </button>
                </div>
                {prizeWinners.length > 0 && (
                  <ol className="mt-2 space-y-1">
                    {prizeWinners.map(w => (
                      <li key={`${w.name}-${w.at}`} className="flex flex-wrap items-center gap-2 text-sm">
                        <FaTrophy className="h-3 w-3 text-amber-500" aria-hidden />
                        <span className="font-semibold text-green-700 dark:text-green-300">{w.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          <RelativeDate iso={w.at} />
                        </span>
                        {w.comment && (
                          <span
                            className="min-w-0 max-w-full truncate text-xs italic text-gray-500 dark:text-gray-400"
                            title={w.comment}>
                            “{w.comment}”
                          </span>
                        )}
                        <span className="ml-auto flex gap-1">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => dropWinner(w.index, true)}
                            title="Draw someone else instead"
                            className="cursor-pointer rounded px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-100">
                            <FaRedo className="mr-1 inline h-2.5 w-2.5" />
                            Redraw
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => dropWinner(w.index, false)}
                            className="cursor-pointer rounded px-1.5 py-0.5 text-xs text-gray-500 hover:text-red-600 disabled:opacity-50">
                            Remove
                          </button>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            );
          })}
        </ul>

        {draft.winners.length > 0 && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Announcement</p>
              <button
                type="button"
                onClick={() => void copyAnnouncement()}
                className="cursor-pointer text-xs font-medium text-sky-700 hover:underline dark:text-sky-300">
                <FaCopy className="mr-1 inline h-3 w-3" />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-800 dark:bg-gray-800/50 dark:text-gray-200">
              {announcement}
            </pre>
          </div>
        )}
        <WinnerMessages title={draft.title} prizes={draft.prizes} winners={draft.winners} />
        {draft.winners.some(w => !draft.prizes.some(p => p.id === w.prize)) && (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            Some winners belong to a prize that was removed (
            {draft.winners
              .filter(w => !draft.prizes.some(p => p.id === w.prize))
              .map(w => `${w.name} – ${prizeName(w.prize)}`)
              .join(", ")}
            ).
          </p>
        )}
      </Section>

      {(dirty || error) && (
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
          {error ? (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-200">Unsaved changes</p>
          )}
          {dirty && (
            <span className="ml-auto flex gap-2">
              <button type="button" disabled={saving} onClick={() => setDraft(draftOf(draw))} className={ghostButton}>
                Discard
              </button>
              <button
                type="button"
                disabled={saving || !draft.title.trim()}
                onClick={() => void save()}
                className={primaryButton}>
                {saving ? "Saving…" : "Save"}
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
