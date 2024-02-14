import { HttpStatusCode } from '@angular/common/http';
import { Component, Inject, OnInit, Optional } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RESPONSE } from '@nestjs/ng-universal/dist/tokens';
import { Response } from 'express';
import { isEmpty } from 'lodash';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { CommonService } from '../../core/common.service';
import { DestroyService } from '../../core/destroy.service';
import { MetaService } from '../../core/meta.service';
import { PageComponent } from '../../core/page.component';
import { PlatformService } from '../../core/platform.service';
import { TenantAppModel } from '../../interfaces/tenant-app.interface';
import { OptionService } from '../../services/option.service';
import { TenantAppService } from '../../services/tenant-app.service';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.less'],
  standalone: true,
  imports: [RouterLink],
  providers: [DestroyService]
})
export class NotFoundComponent extends PageComponent implements OnInit {
  appInfo!: TenantAppModel;

  protected pageIndex = '404';

  constructor(
    @Optional() @Inject(RESPONSE) private response: Response,
    private destroy$: DestroyService,
    private platform: PlatformService,
    private metaService: MetaService,
    private commonService: CommonService,
    private tenantAppService: TenantAppService,
    private optionService: OptionService
  ) {
    super();
    if (this.platform.isServer) {
      this.response.status(HttpStatusCode.NotFound);
    }
  }

  ngOnInit(): void {
    this.updatePageOptions();
    this.updateActivePage();

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        this.appInfo = appInfo;

        this.metaService.updateHTMLMeta({
          title: `404 - ${appInfo.appName}`,
          description: appInfo.appDescription,
          author: options['site_author'],
          keywords: appInfo.appKeywords
        });
      });
  }

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.pageIndex);
  }

  protected updatePageOptions(): void {
    this.commonService.updatePageOptions({
      showHeader: true,
      showFooter: true,
      showMobileHeader: true,
      showMobileFooter: true
    });
  }
}
