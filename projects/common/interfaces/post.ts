import { BreadcrumbEntity, QueryParam, ResultList, UserDto } from 'common/core';
import {
  ContentForm,
  ContentType,
  PostCommentStatus,
  PostLicense,
  PostStatus,
  PostVisibility,
  SwitchValue
} from 'common/enums';
import { BookEntity } from './book';
import { TagVo } from './tag';
import { CategoryVo } from './category';

export interface PostEntity {
  id: string;
  title: string;
  slug?: string;
  url: string;
  content: string;
  summary?: string;
  contentType: ContentType;
  contentForm?: ContentForm;
  coverImageUrl?: string;
  coverWallpaperId?: string;
  isOriginal: SwitchValue;
  author?: string;
  translator?: string;
  source?: string;
  sourceUrl?: string;
  bookId?: string;
  bookColumnId?: string;
  isPaid?: SwitchValue;
  price?: number;
  trialPercent?: number;
  license: PostLicense;
  visibility: PostVisibility;
  viewPassword?: string;
  commentStatus?: PostCommentStatus;
  status: PostStatus;
  isPinned?: SwitchValue;
  pinnedAt?: number;
  publishedAt: number;
  parentId?: string;
}

export interface PostStatVo {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
}

export interface PostModel extends PostEntity {
  url: string;
  creatorId?: string;
  creator: UserDto;
  createdAt: number;
  updatedAt: number;
  postStat: PostStatVo;
  coverUrl: string;
}

export interface PostCategoryVo {
  postId: string;
  sort: number;
  category: CategoryVo;
}

export interface PostTagVo {
  postId: string;
  sort: number;
  tag: TagVo;
}

export interface PostVo extends PostModel {
  metadata: Record<string, string>;
  categories: PostCategoryVo[];
  tags: PostTagVo[];
  book?: BookEntity;
  breadcrumbs?: BreadcrumbEntity[];
  isFavorite: boolean;
  isVoted: boolean;
}

export interface PostQueryParam extends QueryParam {
  category?: string;
  tag?: string;
  year?: string;
  month?: string;
  isPinned?: 0 | 1;
}

export interface PostList {
  posts: ResultList<PostVo>;
  book?: BookEntity;
  breadcrumbs?: BreadcrumbEntity[];
}

export interface PrevAndNextPosts {
  prevPost: PostEntity;
  nextPost: PostEntity;
}

export interface PostSearchItem {
  postId: string;
  title: string;
  url: string;
  coverUrl: string;
  score: number;
}
