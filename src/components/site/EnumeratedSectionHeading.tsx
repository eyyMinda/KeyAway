import type { ElementType, ReactNode } from "react";

export interface EnumeratedSectionHeadingProps {
  index: number;
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}

/**
 * Numbered section title for legal/long-form pages.
 * Uses flex `gap` (not margin on the badge) so plain text and `text-gradient-pro` spans space correctly.
 */
export default function EnumeratedSectionHeading({
  index,
  children,
  className = "",
  as: Tag = "h2"
}: EnumeratedSectionHeadingProps) {
  const Heading = Tag as ElementType;

  return (
    <Heading className={`section-title mb-4 flex items-center gap-3 ${className}`.trim()}>
      <span
        aria-hidden
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-[#4a90c4] bg-[#1a2f45] text-sm font-bold text-[#66c0f4]">
        {index}
      </span>
      <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">{children}</span>
    </Heading>
  );
}
