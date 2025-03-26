import { CommentFlag } from '../enums/comment';
import { CopyType } from '../enums/copyright';
import { PostFormat, PostScope, PostStatus, PostType } from '../enums/post';
import { BookEntity } from './book';
import { BreadcrumbEntity } from './breadcrumb';
import { QueryParam, ResultList } from './common';
import { TagEntity } from './tag';
import { TaxonomyEntity } from './taxonomy';
import { UserEntity } from './user';

export interface PostEntity {
  postId: string;
  postTitle: string;
  postName?: string;
  postContent: string;
  postExcerpt: string;
  postDate: number;
  postCover?: string;
  postWallpaperCover?: string;
  cover: string;
  postOriginal: number;
  postAuthor?: string;
  postTranslator?: string;
  postSource?: string;
  postSourceLink?: string;
  postLoginFlag: number;
  postPayFlag: number;
  postPrice?: number;
  postFreeIndex?: number;
  postFreePercent?: number;
  postFreeContent?: string;
  postCopyType: CopyType;
  postScope: PostScope;
  postPassword?: string;
  commentFlag: CommentFlag;
  postStatus: PostStatus;
  postSticky: number;
  postStickyTime?: number;
  postType: PostType;
  postFormat: PostFormat;
  postMimeType?: string;
  postOwnerId: string;
  postGuid: string;
  postParent?: string;
  postViews: number;
  postLikes: number;
  postComments: number;
  postFavorites: number;
  postCreated: number;
  postModified: number;
  owner: UserEntity;
}

export interface PostModel extends PostEntity {
  postPassword: string;
  postName: string;
  postMimeType: string;
}

export interface Post {
  post: PostModel;
  meta: Record<string, string>;
  categories: TaxonomyEntity[];
  tags: TagEntity[];
  book?: BookEntity;
  breadcrumbs?: BreadcrumbEntity[];
  isFavorite: boolean;
  isVoted: boolean;
}

export interface PostQueryParam extends QueryParam {
  postType?: PostType;
  category?: string;
  tag?: string;
  year?: string;
  month?: string;
  bookId?: string;
  sticky?: 0 | 1;
  simple?: 0 | 1;
}

export interface PostList {
  posts: ResultList<Post>;
  book?: BookEntity;
  breadcrumbs: BreadcrumbEntity[];
}

export interface PrevAndNextPosts {
  prevPost: PostEntity;
  nextPost: PostEntity;
}

export interface PostSearchItem {
  postId: string;
  postTitle: string;
  postGuid: string;
  cover: string;
  score: number;
}

export interface PostRelatedParam {
  postId: string;
  page?: number;
  size?: number;
}
