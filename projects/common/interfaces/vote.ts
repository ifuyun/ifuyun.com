import { VoteType, VoteValue } from 'common/enums';

export interface VoteDto {
  targetId: string;
  value: VoteValue;
  type: VoteType;
}
