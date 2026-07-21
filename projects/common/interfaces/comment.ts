import { UserModel } from 'common/core';
import { CommentStatus, CommentTargetType } from 'common/enums';
import { IPInfo } from './ip';

export interface CommentDto {
  targetId: string;
  targetType: CommentTargetType;
  parentId?: string;
  topId?: string;
  userName?: string;
  userEmail?: string;
  content: string;
}

export interface CommentModel extends CommentDto {
  id: string;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
  userEmailHash: string;
  userHomepage: string;
  userIp: string;
  userAgent: string;
  parentId: string;
  userId: string;
  likes: number;
  dislikes: number;
  user?: UserModel;
  ipInfo: IPInfo;
  userLocation: string;
  liked?: boolean;
  disliked?: boolean;
  idHash: string;
  userAvatar: string;
}

export interface Comment extends CommentModel {
  children: Comment[];
  parent?: Comment;
  depth?: number;
  isLeaf: boolean;
}
