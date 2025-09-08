import { UserModel } from 'common/core';
import { LlmProvider, BotScope, BotStatus } from 'common/enums';
import { LlmModel } from './llm-model';

export interface BotEntity {
  botId: string;
  botParentId?: string;
  botName: string;
  llmProviderId: string;
  llmModelId: string;
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
  llmProvider: LlmProvider;
  llmModel: LlmModel;
  isFollowed?: boolean;
  isOwn?: boolean;
}
