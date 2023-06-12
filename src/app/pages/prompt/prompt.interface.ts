import { PromptLang, PromptScope, PromptStatus } from './prompt.enum';

export interface PromptEntity {
  promptId: string;
  promptTitle: string;
  promptContent: string;
  promptLang: PromptLang;
  promptScope: PromptScope;
  promptStatus: PromptStatus;
  promptOrder: number;
}
