import { VoteType, VoteValue } from '../config/common.enum';
import { AppParam } from '../core/common.interface';
import { Guest } from './user.interface';

export interface VoteEntity extends AppParam {
  objectId: string;
  value: VoteValue;
  type: VoteType;
  user?: Guest | null;
}
