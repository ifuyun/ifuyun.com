export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant'
}

export enum MessageStatus {
  NORMAL = 1,
  TRASHED = 2,
  INTERRUPTED = 50,
  ABORTED = 51
}

export type ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | null;
