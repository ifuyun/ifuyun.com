import { MessageRole, MessageStatus } from './bot-chat.enum';

export interface BotMessage {
  messageId: string;
  conversationId: string;
  messageRole: MessageRole;
  messageContent: string;
  messageReasoningContent: string;
  messageTokens: number;
  messageVote: number;
  messageStatus: MessageStatus;
  userId: string;
  messageCreated: number;
  messageModified: number;
  appId?: string;
}

export interface ChatMessage {
  messageId?: string;
  role: MessageRole;
  content: string;
  html?: string;
  reasoningContent?: string;
  reasoningHtml?: string;
  created?: number;
  vote?: number;
  name?: string;
  loading?: boolean;
  thinking?: boolean;
  expanded?: boolean;
  copying?: boolean;
  status?: 'done' | 'error';
}

export interface ChatParam {
  conversationId: string;
  message: string;
}

export interface ChatUsage {
  // 问题tokens数
  prompt_tokens: number;
  // 回答tokens数，如果是流式消息，则是当前chunk的tokens数
  completion_tokens: number;
  // tokens总数
  total_tokens: number;
}

export interface ChatResponse {
  id: string;
  created: number;
  model: string;
  choices: {
    // 非流式
    message: {
      role?: string;
      content: string;
    };
    // 流式
    delta: {
      reasoning_content?: string;
      content?: string;
    };
    index: number;
    finish_reason: string | null;
    usage?: ChatUsage;
  }[];
  usage?: ChatUsage;
}

export interface ChatEventData {
  type: 'message' | 'thinking' | 'done' | 'error';
  message?: string;
  reasoningMessage?: string;
  conversationId?: string;
  error?: Error;
}
