import { Injectable } from '@angular/core';
import { PaginatorEntity, PaginatorRange } from '../interfaces/paginator';

@Injectable({
  providedIn: 'root'
})
export class PaginatorService {
  // todo: get from db:options
  private pageSize = 10;
  private paginationSize = 9;

  getPageSize(): number {
    return this.pageSize;
  }

  /**
   * 获取分页数据
   * @param {number} page 请求页
   * @param {number} pages 总页数
   * @param {number} paginationSize 每页显示页数
   * @return {PaginatorRange} 分页数据对象
   * @version 1.0.0
   * @since 1.0.0
   */
  getPageData(page: number, pages: number, paginationSize: number): PaginatorRange {
    const pageData: PaginatorRange = {
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
   * @return {PaginatorEntity} 分页对象
   * @version 1.0.0
   * @since 1.0.0
   */
  getPaginator(page: string | number, total: number): PaginatorEntity {
    let pages = Math.ceil(total / this.pageSize); // 总页数
    if (typeof page === 'string') {
      // page是字符串
      page = parseInt(page, 10);
    }
    pages = pages || 1;
    page = Math.min(pages, page || 1);

    const pageData = this.getPageData(page, pages, this.paginationSize);

    return {
      startPage: pageData.start,
      endPage: pageData.end,
      prevPage: page <= 1 ? 0 : page - 1,
      nextPage: page >= pages ? 0 : page + 1,
      curPage: page,
      totalPage: pages,
      pageLimit: this.pageSize,
      total
    };
  }
}
