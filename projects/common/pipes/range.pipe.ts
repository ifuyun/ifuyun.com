import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'range'
})
export class RangePipe implements PipeTransform {
  transform(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i);
  }
}
