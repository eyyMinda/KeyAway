"use client";

import { FaRegCommentDots } from "react-icons/fa";
import { scrollToSectionWithHeaderOffset } from "@/src/lib/dom/scrollToSection";
import { PROGRAM_COMMENTS_SECTION_SELECTOR } from "@/src/lib/program/programCommentsSection";

type ProgramCommentsJumpLinkProps = {
  count: number;
  className?: string;
};

export default function ProgramCommentsJumpLink({ count, className = "" }: ProgramCommentsJumpLinkProps) {
  function scrollToComments() {
    scrollToSectionWithHeaderOffset(PROGRAM_COMMENTS_SECTION_SELECTOR);
    window.history.replaceState(null, "", PROGRAM_COMMENTS_SECTION_SELECTOR);
  }

  const label =
    count === 0 ? "Jump to comments — none yet" : `Jump to comments (${count} ${count === 1 ? "post" : "posts"})`;

  return (
    <button
      type="button"
      onClick={scrollToComments}
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-sm p-0.5 text-sm text-[#8f98a0] transition-colors hover:text-[#66c0f4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1923] ${className}`.trim()}>
      <FaRegCommentDots className="h-5 w-5" aria-hidden />
      <span className="font-medium tabular-nums">{count}</span>
    </button>
  );
}
