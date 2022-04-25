import { BreadcrumbEntity } from '../components/breadcrumb/breadcrumb.interface';
import { CommentFlag, PostType } from '../config/common.enum';
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
  commentFlag: CommentFlag;
  postOriginal: number;
  postModified: Date;
  postCreated: Date;
  postParent: string;
  postType: PostType;
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
  crumbs?: BreadcrumbEntity[];
}

export interface PostList {
  posts?: Post[];
  page?: number;
  total?: number;
}

export interface PostArchiveDate {
  dateText: string;
  dateTitle: string;
  count?: number;
}

export interface PostArchiveDateMap {
  [year: string]: {
    list: PostArchiveDate[];
    countByYear: number;
  };
}

export interface PostArchiveDateList {
  dateList: PostArchiveDateMap;
  yearList: string[];
}

export interface PostQueryParam {
  page: number;
  keyword?: string;
  category?: string;
  tag?: string;
  year?: string;
  month?: string;
}
