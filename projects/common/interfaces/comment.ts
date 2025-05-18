import { UserModel } from 'common/core';
import { CommentObjectType } from 'common/enums';
import { IPInfo } from './ip';

export interface MetaData {
  metaKey: string;
  metaValue: string;
}

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
