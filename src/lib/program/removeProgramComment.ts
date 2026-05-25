import { client } from "@/src/sanity/lib/client";

export async function removeProgramComment(opts: {
  programId: string;
  commentKey: string;
  replyKey?: string;
}): Promise<void> {
  const { programId, commentKey, replyKey } = opts;
  const safeCommentKey = commentKey.replace(/"/g, '\\"');

  if (replyKey?.trim()) {
    const safeReplyKey = replyKey.replace(/"/g, '\\"');
    await client
      .patch(programId)
      .unset([`programComments[_key=="${safeCommentKey}"].replies[_key=="${safeReplyKey}"]`])
      .commit();
    return;
  }

  await client.patch(programId).unset([`programComments[_key=="${safeCommentKey}"]`]).commit();
}
