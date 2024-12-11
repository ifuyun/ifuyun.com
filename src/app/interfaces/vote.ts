import { VoteType, VoteValue } from '../enums/vote';
import { AppParam } from './common';

export interface VoteEntity extends AppParam {
  objectId: string;
  value: VoteValue;
  type: VoteType;
}
