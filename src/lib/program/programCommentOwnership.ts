export type ProgramCommentOwnership = {
  commentKeys: string[];
  replies: Array<{ commentKey: string; replyKey: string }>;
};

export function replyOwnershipKey(commentKey: string, replyKey: string): string {
  return `${commentKey}:${replyKey}`;
}
