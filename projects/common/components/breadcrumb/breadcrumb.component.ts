import { Component, inject, OnInit, signal } from '@angular/core';
import { AppConfigService, BreadcrumbEntity, BreadcrumbService, DestroyService, UserAgentService } from 'common/core';
import { TenantAppVo } from 'common/interfaces';
import { TenantAppService } from 'common/services';
import { isEmpty } from 'lodash';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { SmartLinkComponent } from '../smart-link/smart-link.component';

@Component({
  selector: 'lib-breadcrumb',
  imports: [NzIconModule, SmartLinkComponent],
  providers: [DestroyService],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.less'
})
export class BreadcrumbComponent implements OnInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly appConfigService = inject(AppConfigService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly uaService = inject(UserAgentService);

  readonly isMobile = this.uaService.isMobile;
  readonly breadcrumbs = signal<BreadcrumbEntity[]>([]);

  private readonly appInfo = signal<TenantAppVo | null>(null);
  private readonly domains = this.appConfigService.apps;

  ngOnInit(): void {
    combineLatest([this.tenantAppService.appInfo$, this.breadcrumbService.breadcrumbs$])
      .pipe(
        skipWhile(([appInfo]) => isEmpty(appInfo)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, breadcrumbs]) => {
        this.appInfo.set(appInfo);

        if (breadcrumbs.length > 0) {
          this.breadcrumbs.set([
            {
              label: '首页',
              url: this.domains['www'].url || '',
              tooltip: appInfo.name || '',
              isHeader: false
            },
            ...breadcrumbs.map((item) => {
              return {
                ...item,
                url: item.url
                  ? item.domain && item.url !== '.'
                    ? this.domains[item.domain].url + item.url
                    : item.url
                  : ''
              };
            })
          ]);
        }
      });
  }
}
