import { IPLocation, MetaData } from './common';
import { UserModel } from './users';

export interface CommentEntity {
  postId: string;
  commentParent?: string;
  commentTop?: string;
  authorName: string;
  authorEmail: string;
  commentContent: string;
  captchaCode?: string;
  userId?: string;
}

export interface CommentModel extends CommentEntity {
  commentId: string;
  commentCreated: Date;
  authorEmailHash: string;
  authorAvatar?: string;
  authorLink?: string;
  authorIp?: string;
  user?: UserModel;
  userLocation: IPLocation;
  commentLikes: number;
  commentDislikes: number;
  commentMeta?: MetaData[];
  commentMetaMap?: Record<string, string>;
  liked?: boolean;
  disliked?: boolean;
}

export interface Comment extends CommentModel {
  children: Comment[];
  parent?: Comment;
  level?: number;
  isLeaf: boolean;
}

export interface CommentList {
  comments?: Comment[];
  page?: number;
  total?: number;
}
