import { client } from "@/src/sanity/lib/client";
import type { ProgramComment, ProgramCommentReply } from "@/src/types/program";

const MAX_COMMENTS_ON_PROGRAM = 400;

type SanityCommentRow = ProgramComment & { _key: string; _type: "programComment" };
type SanityReplyRow = ProgramCommentReply & { _key: string; _type: "programCommentReply" };

function newKey(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export async function appendProgramComment(opts: {
  programId: string;
  authorName: string;
  authorRole?: string;
  body: string;
  ipHash?: string;
  parentCommentKey?: string;
}): Promise<{ comment?: ProgramComment; reply?: ProgramCommentReply; parentCommentKey?: string }> {
  const { programId, authorName, authorRole = "Community member", body, ipHash, parentCommentKey } = opts;
  const createdAt = new Date().toISOString();

  if (parentCommentKey?.trim()) {
    const parentKey = parentCommentKey.trim();
    const reply: SanityReplyRow = {
      _key: newKey(),
      _type: "programCommentReply",
      authorName,
      authorRole,
      body,
      createdAt,
      ...(ipHash ? { ipHash } : {})
    };

    await client
      .patch(programId)
      .setIfMissing({ programComments: [] })
      .insert("after", `programComments[_key=="${parentKey}"].replies[-1]`, [reply])
      .commit();

    return { reply, parentCommentKey: parentKey };
  }

  const existingCount = await client.fetch<number>(`count(*[_id == $id][0].programComments)`, { id: programId });
  if (existingCount >= MAX_COMMENTS_ON_PROGRAM) {
    throw new Error("COMMENT_LIMIT");
  }

  const comment: SanityCommentRow = {
    _key: newKey(),
    _type: "programComment",
    authorName,
    authorRole,
    body,
    createdAt,
    isPinned: false,
    replies: [],
    ...(ipHash ? { ipHash } : {})
  };

  await client
    .patch(programId)
    .setIfMissing({ programComments: [] })
    .insert("after", "programComments[-1]", [comment])
    .commit();

  return { comment };
}
