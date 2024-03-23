import { TagStatus } from '../config/common.enum';

export interface TagEntity {
  tagId: string;
  tagName: string;
  tagStatus: TagStatus;
  objectCount?: number;
}
