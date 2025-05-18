import { VoteType, VoteValue } from 'common/enums';

export interface VoteEntity {
  objectId: string;
  value: VoteValue;
  type: VoteType;
}
