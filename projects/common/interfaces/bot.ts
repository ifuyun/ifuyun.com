import { UserModel } from 'common/core';
import { BotProvider, BotScope, BotStatus } from 'common/enums';
import { BotModel } from './bot-model';

export interface BotEntity {
  botId: string;
  botParentId?: string;
  botName: string;
  botProviderId: string;
  botModelId: string;
  botGreeting: string;
  botExcerpt: string;
  botDescription: string;
  botPrompt?: string;
  botAvatar: string;
  botScope: BotScope;
  botVoice?: string;
  botCategories: string[];
  botTags: string[];
  botTemperature: number;
  botTopP: number;
  botFrequencyPenalty: number;
  botPresencePenalty: number;
  botContextSize: number;
}

export interface Bot extends BotEntity {
  botStatus: BotStatus;
  botCreatorId?: string;
  creator?: UserModel;
  botFollowers?: number;
  botCreated?: number;
  botModified?: number;
  botProvider: BotProvider;
  botModel: BotModel;
  isFollowed?: boolean;
  isOwn?: boolean;
}
