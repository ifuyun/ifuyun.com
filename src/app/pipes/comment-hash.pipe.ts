import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'commentHash'
})
export class CommentHashPipe implements PipeTransform {
  transform(value: string): string {
    return (value || '').substring(2, 10);
  }
}
