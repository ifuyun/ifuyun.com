import { TagStatus } from '../enums/tag';

export interface TagEntity {
  tagId: string;
  tagName: string;
  tagStatus: TagStatus;
  objectCount?: number;
}
