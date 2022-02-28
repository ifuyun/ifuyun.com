export interface CommentDto {
  postId: string;
  parentId?: string;
  commentAuthor: string;
  commentAuthorEmail: string;
  commentContent: string;
  captchaCode?: string;
}

export interface CommentEntity extends CommentDto {
  commentId: string;
  commentStatus: string;
  created: Date;
  modified: Date;
  commentVote: number;
}

export interface CommentModel {
  commentAuthorLink: string;
  commentIp: string;
  commentAgent: string;
  parentId: string;
  userId: string;
}
