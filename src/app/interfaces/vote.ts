import { VoteType, VoteValue } from '../enums/vote';

export interface VoteEntity {
  objectId: string;
  value: VoteValue;
  type: VoteType;
}
