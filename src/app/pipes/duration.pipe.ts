import { Pipe, PipeTransform } from '@angular/core';
import { transformDuration } from 'src/app/utils/helper';

@Pipe({
  name: 'duration'
})
export class DurationPipe implements PipeTransform {
  transform(duration?: number): string {
    return transformDuration(duration);
  }
}
