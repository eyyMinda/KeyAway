"use client";

/** @fileoverview Toggle chips for the prizes one entrant asked for, plus an "all" shortcut. */
import type { DrawPrize } from "@/src/types/giveawayDraws";

export function PrizeToggles({
  prizes,
  selected,
  onChange
}: {
  prizes: DrawPrize[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const all = prizes.length > 0 && prizes.every(p => selected.includes(p.id));
  return (
    <>
      {prizes.map(prize => {
        const on = selected.includes(prize.id);
        return (
          <button
            key={prize.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? selected.filter(id => id !== prize.id) : [...selected, prize.id])}
            className={`cursor-pointer rounded-full border px-2 text-[11px] font-medium leading-5 transition-colors ${
              on
                ? "border-primary-500 bg-primary-600 text-white"
                : "border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-gray-100"
            }`}>
            {prize.name}
          </button>
        );
      })}
      {prizes.length > 1 && (
        <button
          type="button"
          onClick={() => onChange(all ? [] : prizes.map(p => p.id))}
          className="cursor-pointer rounded-full px-2 text-[11px] font-medium leading-5 text-sky-700 hover:underline dark:text-sky-300">
          {all ? "None" : "All"}
        </button>
      )}
    </>
  );
}
