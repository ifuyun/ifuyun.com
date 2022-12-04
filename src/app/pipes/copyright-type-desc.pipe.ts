import { Pipe, PipeTransform } from '@angular/core';
import { COPYRIGHT_TYPE_DESC, DEFAULT_COPYRIGHT_TYPE } from '../pages/post/post.constant';

@Pipe({
  name: 'copyrightTypeDesc'
})
export class CopyrightTypeDescPipe implements PipeTransform {
  transform(value: string): string {
    value = value || DEFAULT_COPYRIGHT_TYPE;
    return COPYRIGHT_TYPE_DESC[value] || value.toString();
  }
}
