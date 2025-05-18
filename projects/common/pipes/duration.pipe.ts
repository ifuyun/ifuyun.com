import { Pipe, PipeTransform } from '@angular/core';
import { transformDuration } from 'common/utils';

@Pipe({
  name: 'duration'
})
export class DurationPipe implements PipeTransform {
  transform(duration?: number): string {
    return transformDuration(duration);
  }
}
