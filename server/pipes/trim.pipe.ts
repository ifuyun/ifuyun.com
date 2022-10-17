import { Injectable, PipeTransform } from '@nestjs/common';
import { trim } from 'lodash';

@Injectable()
export class TrimPipe implements PipeTransform {
  transform(data: string | Record<string, any> | string[]): string | Record<string, any> {
    if (!data) {
      return '';
    }
    if (typeof data === 'string') {
      return trim(data);
    }
    if (Array.isArray(data)) {
      return data.map((item) => trim(item));
    }
    const iterator = (obj: Record<string, any>) => {
      Object.keys(obj).forEach((k) => {
        if (typeof obj[k] === 'string') {
          obj[k] = trim(obj[k]);
        } else if (obj[k]) {
          iterator(obj[k]);
        }
      });
      return obj;
    };
    data = iterator(data);
    return data;
  }
}
