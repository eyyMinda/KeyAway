"use client";

/** @fileoverview Paste comments from a Facebook giveaway post, check what was recognized, then add them as entrants. */
import { useMemo, useState } from "react";
import { entrantKey, matchPrizes, parseGiveawayComments } from "@/src/lib/giveaways/parseGiveawayComments";
import { STAFF_COMMENT_AUTHOR_NAME } from "@/src/lib/program/staffCommentIdentity";
import type { DrawEntrant, DrawPrize } from "@/src/types/giveawayDraws";
import { PrizeToggles } from "./PrizeToggles";

type PreviewRow = { name: string; comment: string; prizes: string[] };

export default function EntrantImport({
  prizes,
  existing,
  onAdd,
  onCancel
}: {
  prizes: DrawPrize[];
  existing: DrawEntrant[];
  /** New entrants plus each one's comment (kept in memory so a winner's comment can be recorded). */
  onAdd: (entrants: DrawEntrant[], comments: Map<string, string>) => void;
  onCancel: () => void;
}) {
  const [raw, setRaw] = useState("");
  const [exclude, setExclude] = useState(STAFF_COMMENT_AUTHOR_NAME);
  const [rows, setRows] = useState<PreviewRow[] | null>(null);

  const excluded = useMemo(() => new Set(exclude.split(",").map(entrantKey).filter(Boolean)), [exclude]);
  const existingKeys = useMemo(() => new Set(existing.map(e => entrantKey(e.n))), [existing]);

  const parse = () => {
    // One row per person: a second comment from someone adds the prizes it asks for.
    const byKey = new Map<string, PreviewRow>();
    for (const { name, comment } of parseGiveawayComments(raw)) {
      const key = entrantKey(name);
      if (!key || excluded.has(key)) continue;
      const found = matchPrizes(comment, prizes);
      const row = byKey.get(key);
      if (row) {
        row.prizes = [...new Set([...row.prizes, ...found])];
        row.comment = [row.comment, comment].filter(Boolean).join(" / ");
      } else byKey.set(key, { name, comment, prizes: found });
    }
    setRows([...byKey.values()]);
  };

  const update = (index: number, next: Partial<PreviewRow>) =>
    setRows(prev => prev && prev.map((row, i) => (i === index ? { ...row, ...next } : row)));

  const unmatched = rows?.filter(r => r.prizes.length === 0).length ?? 0;
  const duplicates = rows?.filter(r => existingKeys.has(entrantKey(r.name))).length ?? 0;

  const add = () => {
    if (!rows) return;
    onAdd(
      rows.map(r => ({ n: r.name, p: r.prizes })),
      new Map(rows.filter(r => r.comment).map(r => [entrantKey(r.name), r.comment]))
    );
  };

  return (
    <section className="rounded-xl border border-sky-200 bg-sky-50/40 p-4 dark:border-sky-500/30 dark:bg-sky-500/5">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Import comments</h4>
      <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
        On the post, choose <strong>All comments</strong>, expand replies you want counted, select the comments and copy
        them. A plain list of <code>Name: comment</code> lines works too. Prizes are matched from each comment&apos;s text.
      </p>

      {!rows ? (
        <>
          <textarea
            value={raw}
            onChange={e => setRaw(e.target.value)}
            rows={8}
            placeholder={"Kondorosi Zoltán\nAdvanced SystemCare Pro, Malware Fighter Pro\n1w\nLike\nReply\n…"}
            className="mt-3 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          <label className="mt-2 block text-xs text-gray-600 dark:text-gray-400">
            Leave out (comma separated, e.g. your page)
            <input
              value={exclude}
              onChange={e => setExclude(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button
              type="button"
              disabled={!raw.trim()}
              onClick={parse}
              className="cursor-pointer rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50">
              Read comments
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
            {rows.length} {rows.length === 1 ? "person" : "people"} found
            {unmatched > 0 && (
              <span className="text-amber-700 dark:text-amber-300">
                {" "}
                · {unmatched} without a recognized prize (they will not be drawn until you pick one)
              </span>
            )}
            {duplicates > 0 && <span> · {duplicates} already entered (their prizes are merged)</span>}
          </p>
          <ul className="mt-2 max-h-96 divide-y divide-gray-200 overflow-y-auto rounded-lg border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
            {rows.map((row, i) => (
              <li key={`${row.name}-${i}`} className="flex flex-col gap-1.5 px-3 py-2 sm:flex-row sm:items-start">
                <div className="min-w-0 sm:w-56 sm:shrink-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{row.name}</p>
                  <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400" title={row.comment}>
                    {row.comment || "(no text)"}
                  </p>
                </div>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                  <PrizeToggles prizes={prizes} selected={row.prizes} onChange={p => update(i, { prizes: p })} />
                  <button
                    type="button"
                    onClick={() => setRows(prev => prev && prev.filter((_, j) => j !== i))}
                    className="ml-auto cursor-pointer rounded px-1.5 text-xs text-gray-400 hover:text-red-600"
                    aria-label={`Leave out ${row.name}`}>
                    Leave out
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRows(null)}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
              Back
            </button>
            <button
              type="button"
              disabled={!rows.length}
              onClick={add}
              className="cursor-pointer rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50">
              Add {rows.length} {rows.length === 1 ? "entrant" : "entrants"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
