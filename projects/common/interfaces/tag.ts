import { TagStatus } from 'common/enums';

export interface TagEntity {
  tagId: string;
  tagName: string;
  tagStatus: TagStatus;
  objectCount?: number;
}
