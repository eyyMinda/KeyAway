import Link from "next/link";
import type { Program } from "@/src/types/program";

type KeySourcePanelProps = {
  program: Program;
  totalKeys: number;
};

export default function KeySourcePanel({ program, totalKeys }: KeySourcePanelProps) {
  const lastUpdated = program._updatedAt
    ? new Date(program._updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" })
    : null;

  return (
    <div className="mx-auto max-w-360 border-t border-[#2a475e]/50 px-4 py-3 sm:px-6 lg:px-8">
      <p className="text-xs leading-relaxed text-[#8f98a0]">
        Keys listed here come from{" "}
        <span className="text-[#c6d4df]">multiple legitimate sources</span> — official vendor promos,
        partner or affiliate giveaways, and community-checked submissions. Each key may come from a
        different channel.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#6d7a86]">
        <span>
          {totalKeys} listed key{totalKeys === 1 ? "" : "s"}
          {lastUpdated ? ` · page updated ${lastUpdated}` : ""}
        </span>
        <span className="text-[#4a5560]" aria-hidden>
          ·
        </span>
        <Link href="/how-it-works" className="text-[#66c0f4] hover:text-white hover:underline">
          How we list & verify keys
        </Link>
        <span className="text-[#4a5560]" aria-hidden>
          ·
        </span>
        <Link href="/verification-policy" className="text-[#66c0f4] hover:text-white hover:underline">
          Verification policy
        </Link>
      </div>
    </div>
  );
}
