import { NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { takeUntil } from 'rxjs';
import { PaginationData, PaginationEntity } from '../../interfaces/pagination';
import { RangePipe } from '../../pipes/range.pipe';
import { DestroyService } from '../../services/destroy.service';
import { PaginationService } from '../../services/pagination.service';
import { UserAgentService } from '../../services/user-agent.service';

@Component({
  selector: 'app-pagination',
  imports: [NgIf, RouterLink, NzIconModule, RangePipe],
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
