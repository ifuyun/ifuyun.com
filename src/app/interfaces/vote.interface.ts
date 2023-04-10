import { VoteType, VoteValue } from '../config/common.enum';
import { Guest } from './user.interface';

export interface VoteEntity {
  objectId: string;
  value: VoteValue;
  type: VoteType;
  user?: Guest | null;
}