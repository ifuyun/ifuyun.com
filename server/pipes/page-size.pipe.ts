import { Injectable, PipeTransform } from '@nestjs/common';
import { MAX_PAGE_SIZE } from '../common/common.constant';

@Injectable()
export class PageSizePipe implements PipeTransform<string, number> {
  private defaultPageSize: number;
  private maxPageSize: number;

  constructor(defaultPageSize?: number, maxPageSize?: number) {
    this.defaultPageSize = defaultPageSize || 10;
    this.maxPageSize = maxPageSize || MAX_PAGE_SIZE;
  }

  transform(value: string | number): number {
    const pageSize = typeof value === 'number' ? value : parseInt(value, 10);
    if (isNaN(pageSize) || pageSize < 0) {
      return this.defaultPageSize;
    }
    if (pageSize > this.maxPageSize) {
      return this.maxPageSize;
    }
    return pageSize;
  }
}
