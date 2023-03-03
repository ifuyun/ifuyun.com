import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'commentHash',
  standalone: true
})
export class CommentHashPipe implements PipeTransform {
  transform(value: string): string {
    return (value || '').substring(2, 10);
  }
}
