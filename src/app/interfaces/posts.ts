import { CrumbEntity } from './crumb';
import { TaxonomyEntity } from './taxonomies';
import { UserEntity } from './users';

export interface PostEntity {
  postId: string;
  postTitle: string;
  postGuid: string;
  postAuthor: string;
  postDate: Date;
  postContent: string;
  postExcerpt: string;
  postStatus: string;
  commentFlag: string;
  postOriginal: number;
  postModified: Date;
  postCreated: Date;
  postParent: string;
  postType: string;
  commentCount: number;
  postViewCount: number;
  author: UserEntity;
}

export interface PostModel extends PostEntity {
  postPassword: string;
  postName: string;
  postMimeType: string;
}

export interface Post {
  post: PostModel;
  meta: Record<string, string>;
  tags: TaxonomyEntity[];
  categories: TaxonomyEntity[];
  crumbs?: CrumbEntity[];
}

export interface PostList {
  posts?: Post[];
  page?: number;
  count?: number;
  postIds?: string[];
}

export interface PostArchiveDate {
  dateText: string;
  dateTitle: string;
  count?: number;
}

export interface PostQueryParam {
  page: number;
  keyword?: string;
  category?: string;
  tag?: string;
  year?: string;
  month?: string;
}

export interface PostContent {
  isCode: boolean;
  body: string;
  lang: string[]
}