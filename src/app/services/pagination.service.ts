import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PaginationData, PaginationEntity, PaginationRange } from '../interfaces/pagination';

@Injectable({
  providedIn: 'root'
})
export class PaginationService {
  private pagination: BehaviorSubject<PaginationData> = new BehaviorSubject<PaginationData>({
    page: 1,
    total: 0,
    pageSize: 10,
    url: ''
  });
  public pagination$: Observable<PaginationData> = this.pagination.asObservable();

  private readonly defaultPageSize = 10;
  private readonly paginationSize = 9;

  updatePagination(pagination: PaginationData) {
    this.pagination.next(pagination);
  }

  /**
   * 获取分页数据
   * @param {number} page 请求页
   * @param {number} pages 总页数
   * @param {number} paginationSize 每页显示页数
   * @return {PaginationRange} 分页数据对象
   */
  getPageData(page: number, pages: number, paginationSize: number): PaginationRange {
    const pageData: PaginationRange = {
      start: 1,
      end: 1
    };
    // 中间页
    const floorPage = Math.floor((paginationSize + 1) / 2);
    // 中间页到两边的间距页数，偶数情况距离低页再减一，距离高页不变
    const ceilPage = Math.ceil((paginationSize - 1) / 2);

    if (pages <= paginationSize) {
      // 总页数小于一屏输出页数
      pageData.start = 1;
      pageData.end = pages;
    } else if (page <= floorPage) {
      // 第一屏
      pageData.start = 1;
      pageData.end = paginationSize;
    } else if (page > floorPage && page + ceilPage <= pages) {
      // 非第一屏，且非最后一屏
      pageData.start = page - ceilPage + ((paginationSize + 1) % 2);
      pageData.end = page + ceilPage;
    } else {
      // 最后一屏
      pageData.start = pages - paginationSize + 1;
      pageData.end = pages;
    }

    return pageData;
  }

  /**
   * 生成分页对象
   * @param {number|string} [page=1] 请求页
   * @param {number} [total] 总记录数
   * @param {number} [size] 每页显示记录数
   * @return {PaginationEntity} 分页对象
   */
  getPagination(page: string | number, total: number, size?: number): PaginationEntity {
    const pageSize = size || this.defaultPageSize;
    let pages = Math.ceil(total / pageSize); // 总页数
    if (typeof page === 'string') {
      // page是字符串
      page = Number(page);
    }
    pages = pages || 1;
    page = Math.min(pages, page || 1);

    const pageData = this.getPageData(page, pages, this.paginationSize);

    return {
      start: pageData.start,
      end: pageData.end,
      prev: page <= 1 ? 0 : page - 1,
      next: page >= pages ? 0 : page + 1,
      page: page,
      pages,
      pageSize,
      total
    };
  }
}
