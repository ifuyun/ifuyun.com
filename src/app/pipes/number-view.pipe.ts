import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numberView'
})
export class NumberViewPipe implements PipeTransform {
  transform(value: number, precision?: string): string | number {
    if (value < 1000) {
      return value;
    }
    if (value < 9950) {
      return Math.round(value / 100) / 10 + 'K';
    }
    if (value <= 10000) {
      return '1W';
    }
    if (precision && precision.toLowerCase() === 'k') {
      return '10K+';
    }
    if (value <= 100000) {
      return Math.round(value / 1000) / 10 + 'W';
    }
    return '10W+';
  }
}
