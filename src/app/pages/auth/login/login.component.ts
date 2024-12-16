import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { isEmpty, uniq } from 'lodash';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { LoginFormComponent } from '../../../components/login-form/login-form.component';
import { OptionEntity } from '../../../interfaces/option';
import { TenantAppModel } from '../../../interfaces/tenant-app';
import { Wallpaper } from '../../../interfaces/wallpaper';
import { BreadcrumbService } from '../../../services/breadcrumb.service';
import { CommonService } from '../../../services/common.service';
import { DestroyService } from '../../../services/destroy.service';
import { MetaService } from '../../../services/meta.service';
import { OptionService } from '../../../services/option.service';
import { PlatformService } from '../../../services/platform.service';
import { TenantAppService } from '../../../services/tenant-app.service';
import { WallpaperService } from '../../../services/wallpaper.service';
import { AuthComponent } from '../auth.component';

@Component({
  selector: 'app-login',
  imports: [LoginFormComponent],
  providers: [DestroyService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.less'
})
export class LoginComponent extends AuthComponent implements OnInit, OnDestroy {
  wallpaper: Wallpaper | null = null;

  protected pageIndex = 'auth-login';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};

  constructor(
    @Inject(DOCUMENT) protected override document: Document,
    private readonly destroy$: DestroyService,
    private readonly platform: PlatformService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly wallpaperService: WallpaperService
  ) {
    super(document);
  }

  ngOnInit(): void {
    this.updatePageIndex();
    this.updateBreadcrumb();

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        this.appInfo = appInfo;
        this.options = options;

        if (this.platform.isServer) {
          this.updatePageInfo();
          this.getWallpaper();
        }
      });
  }

  ngOnDestroy(): void {
    this.clearStyles();
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getWallpaper() {
    this.wallpaperService
      .getRandomWallpapers(1, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.wallpaper = res[0] || null;
        if (this.wallpaper) {
          this.initStyles();
        }
      });
  }

  private updatePageInfo() {
    this.metaService.updateHTMLMeta({
      title: ['登录', this.appInfo.appName].join(' - '),
      description: this.appInfo.appDescription,
      author: this.options['site_author'],
      keywords: uniq(this.appInfo.keywords).join(',')
    });
  }

  private updateBreadcrumb() {
    this.breadcrumbService.updateBreadcrumbs([]);
  }
}
