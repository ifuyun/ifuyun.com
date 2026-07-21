import { MessageRole, MessageStatus, ReasoningEffort } from './ai-chat.enum';

export interface BotMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  reasoningContent: string;
  tokens: number;
  vote: number;
  status: MessageStatus;
  userId: string;
  createdAt: number;
  updatedAt: number;
  appId?: string;
}

export interface ChatMessage {
  id?: string;
  role: MessageRole;
  content: string;
  html?: string;
  reasoningContent?: string;
  reasoningHtml?: string;
  createdAt?: number;
  vote?: number;
  name?: string;
  loading?: boolean;
  thinking?: boolean;
  expanded?: boolean;
  copying?: boolean;
  status?: 'done' | 'error';
}

export interface StreamChatParam {
  conversationId: string;
  message: string;
  effort?: ReasoningEffort;
}

export interface StreamChatEvent {
  type: 'thinking' | 'message' | 'done' | 'error';
  message?: string;
  reasoningMessage?: string;
}

export interface ChatUsage {
  // 问题tokens数
  prompt_tokens: number;
  // 回答tokens数，如果是流式消息，则是当前chunk的tokens数
  completion_tokens: number;
  // tokens总数
  total_tokens: number;
}

export interface ChatChunk {
  id: string;
  createdAt: number;
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
