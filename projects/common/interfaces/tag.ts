import { TagStatus } from 'common/enums';

export interface TagVo {
  id: string;
  name: string;
  status: TagStatus;
  objectCount?: number;
}
