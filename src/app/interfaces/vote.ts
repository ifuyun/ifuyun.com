import { VoteType, VoteValue } from 'src/app/enums/vote';

export interface VoteEntity {
  objectId: string;
  value: VoteValue;
  type: VoteType;
}
