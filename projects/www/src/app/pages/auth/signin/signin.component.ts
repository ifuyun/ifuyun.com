import { Component, inject, OnInit, signal } from '@angular/core';
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
  private readonly destroy$ = inject(DestroyService);
  private readonly commonService = inject(CommonService);
  private readonly metaService = inject(MetaService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);

  protected readonly pageIndex = 'auth-signin';

  private readonly appInfo = signal<TenantAppVo | null>(null);
  private readonly options = signal<OptionEntity>({});

  ngOnInit(): void {
    this.updatePageIndex();
    this.updateBreadcrumbs();

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        this.appInfo.set(appInfo);
        this.options.set(options);

        this.updatePageInfo();
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private updatePageInfo() {
    this.metaService.updateHTMLMeta({
      title: ['登录', this.appInfo()!.name].join(' - '),
      description: this.appInfo()!.description,
      author: this.options()['site_author'],
      keywords: this.appInfo()!.keywords
    });
  }

  private updateBreadcrumbs() {
    this.breadcrumbService.updateBreadcrumbs([]);
  }
}
