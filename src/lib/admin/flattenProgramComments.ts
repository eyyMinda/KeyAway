import type { AdminCommentVisitor, AdminProgramCommentRow } from "@/src/types/admin/programComments";
import type { Program, ProgramComment, ProgramCommentReply } from "@/src/types/program";
import { commentBodyToPlain } from "@/src/lib/program/commentBody";

type ProgramWithComments = Pick<Program, "_id" | "title" | "slug" | "programComments">;

function visitorFields(visitor?: AdminCommentVisitor): Pick<
  AdminProgramCommentRow,
  "visitor" | "visitorIsSpammer" | "visitorVisitTier"
> {
  if (!visitor) return {};
  return {
    visitor,
    visitorIsSpammer: visitor.isSpammer,
    visitorVisitTier: visitor.visitTier
  };
}

export function flattenProgramCommentsForAdmin(
  programs: ProgramWithComments[],
  visitorByHash: Record<string, AdminCommentVisitor>
): AdminProgramCommentRow[] {
  const rows: AdminProgramCommentRow[] = [];

  for (const program of programs) {
    const programId = program._id;
    const programTitle = program.title;
    const programSlug = program.slug?.current ?? "";
    const comments = program.programComments ?? [];

    for (const comment of comments) {
      pushCommentRow(rows, programId, programTitle, programSlug, comment, visitorByHash);
      const replies = comment.replies ?? [];
      for (const reply of replies) {
        pushReplyRow(rows, programId, programTitle, programSlug, comment, reply, visitorByHash);
      }
    }
  }

  return rows.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

function pushCommentRow(
  rows: AdminProgramCommentRow[],
  programId: string,
  programTitle: string,
  programSlug: string,
  comment: ProgramComment,
  visitorByHash: Record<string, AdminCommentVisitor>
) {
  const commentKey = comment._key;
  if (!commentKey || !comment.authorName?.trim()) return;
  const body = commentBodyToPlain(comment.body);
  if (!body) return;

  const ipHash = comment.ipHash?.trim();
  const visitor = ipHash ? visitorByHash[ipHash] : undefined;

  rows.push({
    id: `${programId}:${commentKey}`,
    programId,
    programTitle,
    programSlug,
    commentKey,
    isReply: false,
    authorName: comment.authorName,
    authorRole: comment.authorRole,
    body,
    createdAt: comment.createdAt,
    isPinned: comment.isPinned,
    ipHash,
    ...visitorFields(visitor)
  });
}

function pushReplyRow(
  rows: AdminProgramCommentRow[],
  programId: string,
  programTitle: string,
  programSlug: string,
  parent: ProgramComment,
  reply: ProgramCommentReply,
  visitorByHash: Record<string, AdminCommentVisitor>
) {
  const parentKey = parent._key;
  const replyKey = reply._key;
  if (!parentKey || !replyKey || !reply.authorName?.trim()) return;
  const body = commentBodyToPlain(reply.body);
  if (!body) return;

  const ipHash = reply.ipHash?.trim();
  const visitor = ipHash ? visitorByHash[ipHash] : undefined;

  rows.push({
    id: `${programId}:${parentKey}:${replyKey}`,
    programId,
    programTitle,
    programSlug,
    commentKey: replyKey,
    parentCommentKey: parentKey,
    isReply: true,
    authorName: reply.authorName,
    authorRole: reply.authorRole,
    body,
    createdAt: reply.createdAt,
    ipHash,
    ...visitorFields(visitor)
  });
}
