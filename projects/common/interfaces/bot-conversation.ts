import { UserModel } from 'common/core';
import { ConversationStatus } from 'common/enums';
import { Bot } from './bot';

export interface BotConversationEntity {
  id: string;
  title: string;
  botId: string;
}

export interface BotConversationModel extends BotConversationEntity {
  userId: string;
  status: ConversationStatus;
  createdAt?: number;
  updatedAt?: number;
  bot?: Bot;
  user?: UserModel;
  messageCount?: number;
}

export interface AskAIParam {
  targetId: string;
  targetType: 'post' | 'wallpaper';
}
