export interface CommentEntity {
  postId: string;
  parentId?: string;
  commentAuthor: string;
  commentAuthorEmail: string;
  commentContent: string;
  captchaCode?: string;
}

export interface CommentModel extends CommentEntity {
  commentId: string;
  commentStatus: string;
  created: Date;
  modified: Date;
  commentVote: number;
  commentAuthorLink?: string;
  commentIp?: string;
  commentAgent?: string;
  parentId?: string;
  userId?: string;
}
