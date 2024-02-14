import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { DestroyService } from '../../core/destroy.service';
import { UserAgentService } from '../../core/user-agent.service';
import { TenantAppModel } from '../../interfaces/tenant-app.interface';
import { TenantAppService } from '../../services/tenant-app.service';
import { BreadcrumbEntity } from './breadcrumb.interface';
import { BreadcrumbService } from './breadcrumb.service';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.less'],
  standalone: true,
  imports: [NgClass, NgFor, NgIf, RouterLink],
  providers: [DestroyService]
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
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    combineLatest([this.tenantAppService.appInfo$, this.breadcrumbService.crumb$])
      .pipe(
        skipWhile(([appInfo]) => isEmpty(appInfo)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, breadcrumbs]) => {
        this.appInfo = appInfo;
        this.breadcrumbs = [...breadcrumbs];
        this.breadcrumbs.unshift({
          label: '首页',
          url: '/',
          tooltip: this.appInfo.appName,
          isHeader: false
        });
      });
  }
}
