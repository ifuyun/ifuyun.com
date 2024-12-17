import { CommentObjectType } from '../enums/comment';
import { IPInfo, MetaData } from './common';
import { UserModel } from './user';

export interface CommentEntity {
  objectId: string;
  objectType: CommentObjectType;
  commentParent?: string;
  commentTop?: string;
  commentContent: string;
  userId?: string;
}

export interface CommentModel extends CommentEntity {
  commentId: string;
  commentHash: string;
  commentCreated: number;
  commentAuthor: string;
  authorName: string;
  authorEmail?: string;
  authorEmailHash: string;
  authorAvatar?: string;
  authorLink?: string;
  authorIp?: string;
  user?: UserModel;
  ipInfo: IPInfo;
  userLocation: string;
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
