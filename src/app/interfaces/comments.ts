import { IPLocation, MetaData } from './common';

export interface CommentEntity {
  postId: string;
  commentParent?: string;
  commentTop?: string;
  authorName: string;
  authorEmail: string;
  commentContent: string;
  captchaCode?: string;
}

export interface CommentModel extends CommentEntity {
  commentId: string;
  commentCreated: Date;
  authorEmailHash: string;
  authorAvatar?: string;
  authorLink?: string;
  authorIp?: string;
  userLocation: IPLocation;
  commentLikes: number;
  commentDislikes: number;
  commentMeta?: MetaData[];
  commentMetaMap?: Record<string, string>;
  voted?: boolean;
}

export interface CommentList {
  comments?: CommentModel[];
  page?: number;
  total?: number;
}
