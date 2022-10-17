import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  private defaultValue: number;

  constructor(defaultValue?: number) {
    this.defaultValue = defaultValue === undefined ? NaN : defaultValue;
  }

  transform(value: string | number): number {
    const intValue = typeof value === 'number' ? value : parseInt(value, 10);
    if (!isNaN(this.defaultValue)) {
      return isNaN(intValue) ? this.defaultValue : intValue;
    }
    return intValue;
  }
}
