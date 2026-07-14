export type AdminCommentVisitor = {
  visitTier?: string;
  isSpammer?: boolean;
  visitCount?: number;
  reportCount?: number;
  suggestionCount?: number;
  commentCount?: number;
  contributionScore?: number;
  country?: string;
  city?: string;
  lastActivityAt?: string;
};

export type AdminProgramCommentRow = {
  id: string;
  programId: string;
  programTitle: string;
  programSlug: string;
  commentKey: string;
  parentCommentKey?: string;
  isReply: boolean;
  authorName: string;
  authorRole?: string;
  body: string;
  createdAt?: string;
  isPinned?: boolean;
  ipHash?: string;
  visitor?: AdminCommentVisitor;
  /** @deprecated use visitor.isSpammer */
  visitorIsSpammer?: boolean;
  /** @deprecated use visitor.visitTier */
  visitorVisitTier?: string;
};
