import { AppParam, IpInfo, MetaData } from '../../core/common.interface';
import { UserModel } from '../../interfaces/user.interface';
import { CommentObjectType } from './comment.enum';

export interface CommentEntity extends AppParam {
  objectId: string;
  objectType: CommentObjectType;
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
  ipInfo: IpInfo;
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
