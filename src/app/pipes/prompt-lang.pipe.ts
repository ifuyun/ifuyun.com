import { Pipe, PipeTransform } from '@angular/core';
import { PROMPT_LANG } from '../pages/prompt/prompt.constant';

@Pipe({
  name: 'promptLang',
  standalone: true
})
export class PromptLangPipe implements PipeTransform {
  transform(value: string): string {
    return PROMPT_LANG[value] || value;
  }
}
