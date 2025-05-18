import { Params } from '@angular/router';

export interface PaginationData {
  page: number;
  total: number;
  pageSize: number;
  url: string;
  param?: Params;
}

export interface PaginationRange {
  start: number;
  end: number;
}

export interface PaginationEntity {
  start: number;
  end: number;
  prev: number;
  next: number;
  page: number;
  pages: number;
  pageSize: number;
  total: number;
}
