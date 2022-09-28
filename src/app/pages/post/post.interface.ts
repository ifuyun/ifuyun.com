import { BreadcrumbEntity } from '../../components/breadcrumb/breadcrumb.interface';
import { CommentFlag, PostType } from '../../config/common.enum';
import { QueryParam } from '../../core/common.interface';
import { TaxonomyEntity } from '../../interfaces/taxonomy.interface';
import { UserEntity } from '../../interfaces/user.interface';

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
  postPayFlag: number;
  postSticky: number;
  postModified: Date;
  postCreated: Date;
  postParent: string;
  postType: PostType;
  commentCount: number;
  viewCount: number;
  postLikes: number;
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
  breadcrumbs?: BreadcrumbEntity[];
  isFavorite: boolean;
  voted: boolean;
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

export interface PostQueryParam extends QueryParam {
  category?: string;
  tag?: string;
  year?: string;
  month?: string;
}
