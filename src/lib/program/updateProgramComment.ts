import { client } from "@/src/sanity/lib/client";

function escapeKey(key: string): string {
  return key.replace(/"/g, "");
}

type CommentTarget =
  | { kind: "comment"; commentKey: string }
  | { kind: "reply"; commentKey: string; replyKey: string };

function targetPath(target: CommentTarget): string {
  const commentKey = escapeKey(target.commentKey);
  if (target.kind === "comment") {
    return `programComments[_key=="${commentKey}"]`;
  }
  const replyKey = escapeKey(target.replyKey);
  return `programComments[_key=="${commentKey}"].replies[_key=="${replyKey}"]`;
}

async function fetchTargetIpHash(programId: string, target: CommentTarget): Promise<string | null> {
  const commentKey = escapeKey(target.commentKey);
  if (target.kind === "reply") {
    const replyKey = escapeKey(target.replyKey);
    const row = await client.fetch<{ ipHash?: string } | null>(
      `*[_id == $id][0].programComments[_key == $commentKey][0].replies[_key == $replyKey][0]{ ipHash }`,
      { id: programId, commentKey, replyKey }
    );
    return row?.ipHash ?? null;
  }
  const row = await client.fetch<{ ipHash?: string } | null>(
    `*[_id == $id][0].programComments[_key == $commentKey][0]{ ipHash }`,
    { id: programId, commentKey }
  );
  return row?.ipHash ?? null;
}

export async function updateProgramCommentBody(opts: {
  programId: string;
  target: CommentTarget;
  body: string;
  ipHash: string;
}): Promise<{ editedAt: string }> {
  const { programId, target, body, ipHash } = opts;
  const ownerHash = await fetchTargetIpHash(programId, target);
  if (!ownerHash || ownerHash !== ipHash) {
    throw new Error("FORBIDDEN");
  }

  const editedAt = new Date().toISOString();
  const base = targetPath(target);

  await client
    .patch(programId)
    .set({
      [`${base}.body`]: body,
      [`${base}.editedAt`]: editedAt
    })
    .commit();

  return { editedAt };
}

export type { CommentTarget };
