import Link from "next/link";
import type { ProgramCategoryRef } from "@/src/types/program";

type ProgramCategoryChipsProps = {
  categories?: ProgramCategoryRef[] | null;
  /** Max chips before "+N" (cards). Program page shows all. */
  maxVisible?: number;
  linkToProgramsFilter?: boolean;
  className?: string;
};

export default function ProgramCategoryChips({
  categories,
  maxVisible,
  linkToProgramsFilter = true,
  className = ""
}: ProgramCategoryChipsProps) {
  const items = (categories ?? []).filter(c => c.title?.trim() && c.slug?.trim());
  if (items.length === 0) return null;

  const limit = maxVisible && maxVisible > 0 ? maxVisible : items.length;
  const visible = items.slice(0, limit);
  const overflow = items.length - visible.length;

  const chipClass =
    "inline-flex items-center rounded-sm border border-[#2a475e] bg-[#1b2838] px-2 py-0.5 text-xs font-medium text-[#8f98a0] transition-colors hover:border-[#4a90c4] hover:text-[#c6d4df]";

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
      {visible.map(cat => {
        const label = cat.title.trim();
        const slug = cat.slug!.trim();
        if (linkToProgramsFilter) {
          return (
            <Link
              key={cat._id ?? slug}
              href={`/programs?category=${encodeURIComponent(slug)}`}
              className={chipClass}>
              {label}
            </Link>
          );
        }
        return (
          <span key={cat._id ?? slug} className={chipClass}>
            {label}
          </span>
        );
      })}
      {overflow > 0 ? (
        <span className="text-xs font-medium text-[#556772]">+{overflow}</span>
      ) : null}
    </div>
  );
}
