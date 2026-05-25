"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Program } from "@/src/types/program";
import ProgramCommentsList from "@/src/components/program/comments/ProgramCommentsList";
import ProgramCommentForm from "@/src/components/program/comments/ProgramCommentForm";
import { scrollToSectionWithHeaderOffset } from "@/src/lib/dom/scrollToSection";
import {
  PROGRAM_COMMENTS_SECTION_ID,
  PROGRAM_COMMENTS_SECTION_SELECTOR
} from "@/src/lib/program/programCommentsSection";

type CommentsSectionProps = {
  program: Program;
};

export default function CommentsSection({ program }: CommentsSectionProps) {
  const router = useRouter();
  const slug = program.slug?.current ?? "";
  const [replyTo, setReplyTo] = useState<{ commentKey: string; authorName: string } | null>(null);

  const comments = program.programComments ?? [];

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== PROGRAM_COMMENTS_SECTION_SELECTOR) return;
    requestAnimationFrame(() => {
      scrollToSectionWithHeaderOffset(PROGRAM_COMMENTS_SECTION_SELECTOR);
    });
  }, []);

  function handlePosted() {
    router.refresh();
  }

  return (
    <section
      id={PROGRAM_COMMENTS_SECTION_ID}
      className="relative border-t border-[#2a475e] page-bg py-8 sm:py-12 lg:py-16 overflow-visible">
      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <div className="section-label mb-3 text-neutral-100">Discussion</div>
          <h2 className="section-title mb-2 sm:mb-3">
            Comments <span className="text-gradient-pro">&amp; feedback</span>
          </h2>
          <p className="max-w-2xl section-text">
            Ask questions, share activation tips, or report how keys worked for {program.title}. No account required.
          </p>
        </div>

        <div className="card-base overflow-visible rounded-sm p-4 sm:p-5 lg:p-6 space-y-8">
          <ProgramCommentsList
            comments={comments}
            onReply={c => (c._key ? setReplyTo({ commentKey: c._key, authorName: c.authorName }) : undefined)}
          />

          <div className="border-t border-[#2a475e] pt-6">
            <ProgramCommentForm
              programSlug={slug}
              programTitle={program.title}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              onPosted={handlePosted}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
