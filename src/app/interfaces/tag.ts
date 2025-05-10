import { TagStatus } from 'src/app/enums/tag';

export interface TagEntity {
  tagId: string;
  tagName: string;
  tagStatus: TagStatus;
  objectCount?: number;
}
