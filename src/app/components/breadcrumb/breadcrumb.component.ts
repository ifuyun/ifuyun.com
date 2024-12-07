import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbEntity } from '../../interfaces/breadcrumb';
import { TenantAppModel } from '../../interfaces/tenant-app';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { DestroyService } from '../../services/destroy.service';
import { TenantAppService } from '../../services/tenant-app.service';
import { UserAgentService } from '../../services/user-agent.service';

@Component({
  selector: 'app-breadcrumb',
  imports: [NgIf, NgFor, RouterLink, NzIconModule],
  providers: [DestroyService],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.less'
})
export class BreadcrumbComponent implements OnInit {
  isMobile = false;
  breadcrumbs: BreadcrumbEntity[] = [];

  private appInfo!: TenantAppModel;

  constructor(
    private destroy$: DestroyService,
    private breadcrumbService: BreadcrumbService,
    private tenantAppService: TenantAppService,
    private userAgentService: UserAgentService
  ) {
    this.isMobile = this.userAgentService.isMobile;
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
          this.breadcrumbs = [...breadcrumbs];
          this.breadcrumbs.unshift({
            label: '首页',
            url: '/',
            tooltip: this.appInfo.appName,
            isHeader: false
          });
        }
      });
  }
}
