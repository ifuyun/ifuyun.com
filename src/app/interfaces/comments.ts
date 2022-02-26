export interface CommentEntity {
  commentId: string;
  postId: string;
  commentContent: string;
  commentStatus: string;
  commentAuthor: string;
  commentAuthorEmail: string;
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
