"use client";

/** @fileoverview Ready-to-send private message per winner (all their prizes and keys), each with a copy button. */
import { useState } from "react";
import { FaCheck, FaCopy } from "react-icons/fa";
import { buildWinnerMessage, groupWinners, type WinnerMessageOptions } from "@/src/lib/giveaways/winnerMessage";
import type { DrawPrize, DrawWinner } from "@/src/types/giveawayDraws";

const OPTIONS_STORAGE_KEY = "keyaway:giveaway-message-options";
const DEFAULT_OPTIONS: WinnerMessageOptions = { validity: "14 months", signOff: "🎁" };

/** Last used validity and emoji, so the next giveaway starts from them. */
function readOptions(): WinnerMessageOptions {
  try {
    return { ...DEFAULT_OPTIONS, ...JSON.parse(localStorage.getItem(OPTIONS_STORAGE_KEY) ?? "{}") };
  } catch {
    return DEFAULT_OPTIONS;
  }
}

const input =
  "h-8 rounded-lg border border-gray-300 bg-white px-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

export default function WinnerMessages({
  title,
  prizes,
  winners
}: {
  title: string;
  prizes: DrawPrize[];
  winners: DrawWinner[];
}) {
  const [options, setOptions] = useState<WinnerMessageOptions>(readOptions);
  const [copied, setCopied] = useState<string | null>(null);
  const people = groupWinners(winners, prizes);
  const missingKeys = prizes.some(p => !p.key?.trim() && winners.some(w => w.prize === p.id));

  const update = (next: Partial<WinnerMessageOptions>) => {
    const merged = { ...options, ...next };
    setOptions(merged);
    try {
      localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // Storage blocked: the values still apply for this visit.
    }
  };

  const copy = async (name: string, message: string) => {
    await navigator.clipboard.writeText(message);
    setCopied(name);
    setTimeout(() => setCopied(c => (c === name ? null : c)), 2000);
  };

  if (!people.length) return null;

  return (
    <div className="mt-5">
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Winner messages</p>
        <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          Keys valid for
          <input
            className={`${input} w-28`}
            value={options.validity}
            placeholder="14 months"
            onChange={e => update({ validity: e.target.value })}
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          Sign-off
          <input
            className={`${input} w-14 text-center`}
            value={options.signOff}
            onChange={e => update({ signOff: e.target.value })}
          />
        </label>
      </div>
      {missingKeys && (
        <p className="mb-2 text-xs text-amber-700 dark:text-amber-300">
          Some prizes have no key yet; their messages show [KEY]. Add it under Prizes.
        </p>
      )}
      <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {people.map(person => {
          const message = buildWinnerMessage(person, title, options);
          const done = copied === person.name;
          return (
            <li key={person.name} className="rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-800">
                <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{person.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {person.prizes.length} {person.prizes.length === 1 ? "prize" : "prizes"}
                </span>
                <button
                  type="button"
                  onClick={() => void copy(person.name, message)}
                  className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-500/10">
                  {done ? <FaCheck className="h-3 w-3" /> : <FaCopy className="h-3 w-3" />}
                  {done ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="whitespace-pre-wrap break-words px-3 py-2 font-sans text-sm text-gray-800 dark:text-gray-200">
                {message}
              </pre>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
