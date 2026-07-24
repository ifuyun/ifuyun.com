import { Component, computed, inject, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { DestroyService, PaginationService, UserAgentService } from 'common/core';
import { RangePipe } from 'common/pipes';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'lib-pagination',
  imports: [RouterLink, NzIconModule, RangePipe],
  providers: [DestroyService],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.less'
})
export class PaginationComponent {
  private readonly uaService = inject(UserAgentService);
  private readonly paginationService = inject(PaginationService);

  readonly page = input.required<number>();
  readonly total = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly url = input.required<string>();
  readonly params = input<Params>({});

  readonly isMobile = this.uaService.isMobile;
  readonly pagination = computed(() => {
    return this.paginationService.getPagination(this.page(), this.total(), this.pageSize());
  });

  getUrlParams(page: number): Params {
    if (page === 1) {
      return this.params();
    }
    return { ...this.params(), page };
  }
}
