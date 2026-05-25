import { commentBodyToPlain } from "@/src/lib/program/commentBody";
import type { ProgramComment, ProgramCommentReply } from "@/src/types/program";

type CommentBodyTextProps = {
  body: ProgramComment["body"] | ProgramCommentReply["body"];
  className?: string;
};

export default function CommentBodyText({ body, className = "" }: CommentBodyTextProps) {
  const plain = commentBodyToPlain(body);
  if (!plain) return null;
  return <p className={`whitespace-pre-wrap break-words ${className}`.trim()}>{plain}</p>;
}
