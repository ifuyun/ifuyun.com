export interface PaginatorRange {
  start: number;
  end: number;
}

export interface PaginatorEntity {
  startPage: number;
  endPage: number;
  prevPage: number;
  nextPage: number;
  curPage: number;
  totalPage: number;
  pageLimit: number;
  total: number;
}
