import { VoteType, VoteValue } from '../config/common.enum';
import { Guest } from './users';

export interface VoteEntity {
  objectId: string;
  value: VoteValue;
  type: VoteType;
  user?: Guest | null;
}
