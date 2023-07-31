import { UserModel } from '../../interfaces/user.interface';
import { PromptLang, PromptScope, PromptStatus } from './prompt.enum';

export interface PromptEntity {
  promptId: string;
  promptTitle: string;
  promptContent: string;
  promptOriginal: 0 | 1;
  promptLang: PromptLang;
  promptScope: PromptScope;
  promptStatus: PromptStatus;
  promptMetaMap?: Record<string, string>;
  user: UserModel;
}
