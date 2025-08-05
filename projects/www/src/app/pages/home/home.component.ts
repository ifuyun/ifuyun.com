import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CarouselComponent, PostItemComponent, WallpaperItemComponent } from 'common/components';
import {
  AppConfigService,
  AppDomainConfig,
  BreadcrumbService,
  DestroyService,
  MetaService,
  OptionEntity,
  UserAgentService
} from 'common/core';
import { ListMode, WallpaperLang } from 'common/enums';
import { Post, PostEntity, TenantAppModel, Wallpaper } from 'common/interfaces';
import { NumberViewPipe } from 'common/pipes';
import { CommonService, OptionService, PostService, TenantAppService, WallpaperService } from 'common/services';
import { isEmpty, uniq } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [
    DatePipe,
    NzButtonModule,
    NzIconModule,
    CarouselComponent,
    NumberViewPipe,
    PostItemComponent,
    WallpaperItemComponent
  ],
  providers: [DestroyService],
  templateUrl: './home.component.html',
  styleUrl: './home.component.less'
})
export class HomeComponent implements OnInit {
  readonly wallpaperListMode = ListMode.LIST;

  isMobile = false;
  domains!: AppDomainConfig;
  hotPosts: PostEntity[] = [];
  latestPosts: Post[] = [];
  latestWallpapers: Wallpaper[] = [];

  protected pageIndex = 'index';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};

  constructor(
    private readonly destroy$: DestroyService,
    private readonly userAgentService: UserAgentService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly appConfigService: AppConfigService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly postService: PostService,
    private readonly wallpaperService: WallpaperService
  ) {
    this.isMobile = this.userAgentService.isMobile;
    this.domains = this.appConfigService.apps;
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
        this.getLatestPosts();
        this.getLatestWallpapers();
        if (!this.isMobile) {
          this.getHotPosts();
        }
      });
  }

  getWallpaperUrl(wallpaper: Wallpaper): string {
    const url = this.domains['wallpaper'].url + '/detail/' + wallpaper.wallpaperId;
    const param = wallpaper.isCn ? '' : '?lang=' + WallpaperLang.EN;

    return url + param;
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getLatestPosts() {
    this.postService
      .getPosts({
        page: 1,
        size: this.isMobile ? 10 : 8,
        sticky: 0
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.latestPosts = res.posts?.list || [];
      });
  }

  private getLatestWallpapers() {
    this.wallpaperService
      .getWallpapers({
        page: 1,
        size: this.isMobile ? 10 : 8,
        lang: [WallpaperLang.CN, WallpaperLang.EN]
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.latestWallpapers = res.list || [];
      });
  }

  private getHotPosts() {
    this.postService
      .getHotPosts()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.hotPosts = res;
      });
  }

  private updatePageInfo() {
    const titles = [this.appInfo.appSlogan || '首页', this.appInfo.appName];
    const description = this.appInfo.appDescription;
    const keywords: string[] = [...this.appInfo.keywords];

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description,
      keywords: uniq(keywords)
        .filter((item) => !!item)
        .join(','),
      author: this.options['site_author']
    });
  }

  private updateBreadcrumbs() {
    this.breadcrumbService.updateBreadcrumbs([]);
  }
}
