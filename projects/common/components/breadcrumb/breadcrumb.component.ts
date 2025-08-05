import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AppConfigService,
  AppDomainConfig,
  BreadcrumbEntity,
  BreadcrumbService,
  DestroyService,
  UserAgentService
} from 'common/core';
import { TenantAppModel } from 'common/interfaces';
import { TenantAppService } from 'common/services';
import { isEmpty } from 'lodash';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { SmartLinkComponent } from '../smart-link/smart-link.component';

@Component({
  selector: 'lib-breadcrumb',
  imports: [RouterLink, NzIconModule, SmartLinkComponent],
  providers: [DestroyService],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.less'
})
export class BreadcrumbComponent implements OnInit {
  isMobile = false;
  breadcrumbs: BreadcrumbEntity[] = [];

  private appInfo!: TenantAppModel;
  private domains!: AppDomainConfig;

  constructor(
    private readonly destroy$: DestroyService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly appConfigService: AppConfigService,
    private readonly tenantAppService: TenantAppService,
    private readonly userAgentService: UserAgentService
  ) {
    this.isMobile = this.userAgentService.isMobile;
    this.domains = this.appConfigService.apps;
  }

  ngOnInit(): void {
    combineLatest([this.tenantAppService.appInfo$, this.breadcrumbService.breadcrumbs$])
      .pipe(
        skipWhile(([appInfo]) => isEmpty(appInfo)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, breadcrumbs]) => {
        this.appInfo = appInfo;

        if (breadcrumbs.length > 0) {
          this.breadcrumbs = breadcrumbs.map((item) => {
            return {
              ...item,
              url: item.url
                ? item.domain && item.url !== '.'
                  ? this.domains[item.domain].url + item.url
                  : item.url
                : ''
            };
          });
          this.breadcrumbs.unshift({
            label: '首页',
            url: this.domains['www'].url,
            tooltip: this.appInfo.appName,
            isHeader: false
          });
        }
      });
  }
}
