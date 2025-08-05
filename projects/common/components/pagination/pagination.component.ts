import { Component, OnInit } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { DestroyService, PaginationData, PaginationEntity, PaginationService, UserAgentService } from 'common/core';
import { RangePipe } from 'common/pipes';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'lib-pagination',
  imports: [RouterLink, NzIconModule, RangePipe],
  providers: [DestroyService],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.less'
})
export class PaginationComponent implements OnInit {
  isMobile = false;
  pagination?: PaginationEntity;

  get linkUrl() {
    return this.paginationData?.url || '';
  }

  private paginationData?: PaginationData;

  constructor(
    private readonly destroy$: DestroyService,
    private readonly userAgentService: UserAgentService,
    private readonly paginationService: PaginationService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngOnInit(): void {
    this.paginationService.pagination$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.paginationData = data;
      this.pagination = this.paginationService.getPagination(data.page, data.total, data.pageSize);
    });
  }

  getLinkParams(page: number): Params {
    const param = this.paginationData?.param || {};
    if (page === 1) {
      return param;
    }
    return { ...param, page };
  }
}
