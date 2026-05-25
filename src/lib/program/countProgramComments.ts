import { hasCommentBody } from "@/src/lib/program/commentBody";
import type { ProgramComment } from "@/src/types/program";

/** Counts top-level comments and replies that would render on the public list. */
export function countProgramDiscussionPosts(comments: ProgramComment[] | undefined | null): number {
  if (!comments?.length) return 0;

  let total = 0;
  for (const comment of comments) {
    if (comment.authorName?.trim() && hasCommentBody(comment.body)) total += 1;
    for (const reply of comment.replies ?? []) {
      if (reply.authorName?.trim() && hasCommentBody(reply.body)) total += 1;
    }
  }
  return total;
}
