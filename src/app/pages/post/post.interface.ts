import { BreadcrumbEntity } from '../../components/breadcrumb/breadcrumb.interface';
import { CommentFlag } from '../../components/comment/comment.enum';
import { PostType } from '../../config/common.enum';
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
  postComments: number;
  postViews: number;
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

export interface PostQueryParam extends QueryParam {
  category?: string;
  tag?: string;
  year?: string;
  month?: string;
  sticky?: 0 | 1;
}
