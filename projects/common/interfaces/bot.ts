import { UserModel } from 'common/core';
import { BotScope, BotStatus } from 'common/enums';
import { LlmModel } from './llm-model';

export interface BotEntity {
  id: string;
  parentId?: string;
  name: string;
  llmProviderId: string;
  llmModelId: string;
  greeting: string;
  summary: string;
  description: string;
  prompt?: string;
  avatarUrl: string;
  scope: BotScope;
  voice?: string;
  botCategories: string[];
  botTags: string[];
  contextSize: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface Bot extends BotEntity {
  status: BotStatus;
  creatorId?: string;
  creator?: UserModel;
  followers?: number;
  createdAt?: number;
  updatedAt?: number;
  llmModel: LlmModel;
  isFollowed?: boolean;
  isOwn?: boolean;
}
