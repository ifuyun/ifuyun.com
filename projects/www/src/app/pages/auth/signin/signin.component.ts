import { Component, OnInit } from '@angular/core';
import { SigninFormComponent } from 'common/components';
import { BaseComponent, BreadcrumbService, DestroyService, MetaService, OptionEntity } from 'common/core';
import { TenantAppVo } from 'common/interfaces';
import { CommonService, OptionService, TenantAppService } from 'common/services';
import { isEmpty } from 'lodash';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'app-signin',
  imports: [SigninFormComponent],
  providers: [DestroyService],
  templateUrl: './signin.component.html'
})
export class SigninComponent extends BaseComponent implements OnInit {
  protected pageIndex = 'auth-signin';

  private appInfo!: TenantAppVo;
  private options: OptionEntity = {};

  constructor(
    private readonly destroy$: DestroyService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService
  ) {
    super();
  }

  ngOnInit(): void {
    this.updatePageIndex();
    this.updateBreadcrumbs();

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        this.appInfo = appInfo;
        this.options = options;

        this.updatePageInfo();
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private updatePageInfo() {
    this.metaService.updateHTMLMeta({
      title: ['登录', this.appInfo.name].join(' - '),
      description: this.appInfo.description,
      author: this.options['site_author'],
      keywords: this.appInfo.keywords
    });
  }

  private updateBreadcrumbs() {
    this.breadcrumbService.updateBreadcrumbs([]);
  }
}
