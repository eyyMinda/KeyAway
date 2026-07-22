import { client } from "@/src/sanity/lib/client";

export type ProgramCommentOwnership = {
  commentKeys: string[];
  replies: Array<{ commentKey: string; replyKey: string }>;
};

export async function fetchProgramCommentOwnership(
  programId: string,
  ipHash: string
): Promise<ProgramCommentOwnership> {
  const comments = await client.fetch<
    Array<{
      _key?: string;
      ipHash?: string;
      replies?: Array<{ _key?: string; ipHash?: string }>;
    }> | null
  >(`*[_id == $id][0].programComments[]{ _key, ipHash, replies[]{ _key, ipHash } }`, { id: programId });

  const commentKeys: string[] = [];
  const replies: Array<{ commentKey: string; replyKey: string }> = [];

  for (const c of comments ?? []) {
    if (c._key && c.ipHash === ipHash) commentKeys.push(c._key);
    for (const r of c.replies ?? []) {
      if (c._key && r._key && r.ipHash === ipHash) {
        replies.push({ commentKey: c._key, replyKey: r._key });
      }
    }
  }

  return { commentKeys, replies };
}

export function replyOwnershipKey(commentKey: string, replyKey: string): string {
  return `${commentKey}:${replyKey}`;
}
