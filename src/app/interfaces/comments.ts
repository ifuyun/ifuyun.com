export interface CommentEntity {
  postId: string;
  commentParent?: string;
  commentAuthor: string;
  commentAuthorEmail: string;
  commentContent: string;
  captchaCode?: string;
}

export interface CommentModel extends CommentEntity {
  commentId: string;
  commentStatus: string;
  commentCreated: Date;
  commentModified: Date;
  commentVote: number;
  commentAuthorLink?: string;
  commentIp?: string;
  commentAgent?: string;
  userId?: string;
  voted?: boolean;
}

export interface CommentList {
  comments?: CommentModel[];
  page?: number;
  total?: number;
}
