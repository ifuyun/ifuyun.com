import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { CarouselComponent, PostItemComponent, WallpaperItemComponent } from 'common/components';
import {
  AppConfigService,
  BreadcrumbService,
  DestroyService,
  MetaService,
  OptionEntity,
  UserAgentService
} from 'common/core';
import { ListMode, WallpaperLang } from 'common/enums';
import { IconCalendarDateComponent, IconChatSquareComponent, IconChatSquareDotsComponent } from 'common/icons';
import { PostEntity, PostVo, TenantAppVo, Wallpaper } from 'common/interfaces';
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
    WallpaperItemComponent,
    IconCalendarDateComponent,
    IconChatSquareDotsComponent,
    IconChatSquareComponent
  ],
  providers: [DestroyService],
  templateUrl: './home.component.html',
  styleUrl: './home.component.less'
})
export class HomeComponent implements OnInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly uaService = inject(UserAgentService);
  private readonly commonService = inject(CommonService);
  private readonly metaService = inject(MetaService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly appConfigService = inject(AppConfigService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);
  private readonly postService = inject(PostService);
  private readonly wallpaperService = inject(WallpaperService);

  readonly wallpaperListMode = ListMode.LIST;
  readonly isMobile = this.uaService.isMobile;
  readonly domains = this.appConfigService.apps;
  readonly hotPosts = signal<PostEntity[]>([]);
  readonly latestPosts = signal<PostVo[]>([]);
  readonly latestWallpapers = signal<Wallpaper[]>([]);

  protected readonly pageIndex = 'index';

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
        this.getLatestPosts();
        this.getLatestWallpapers();
        if (!this.isMobile) {
          this.getHotPosts();
        }
      });
  }

  getWallpaperUrl(wallpaper: Wallpaper): string {
    const url = this.domains['wallpaper'].url + '/detail/' + wallpaper.id;
    const param = wallpaper.isCn ? '' : '?lang=' + WallpaperLang.EN;

    return url + param;
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getLatestPosts() {
    this.postService
      .getLatestPosts(this.isMobile ? 10 : 8)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.latestPosts.set(res || []);
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
        this.latestWallpapers.set(res.list || []);
      });
  }

  private getHotPosts() {
    this.postService
      .getHotPosts()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.hotPosts.set(res);
      });
  }

  private updatePageInfo() {
    const appInfo = this.appInfo()!;
    const titles = [appInfo.slogan || '首页', appInfo.name];
    const description = appInfo.description;
    const keywords: string[] = [...appInfo.keywordList];

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description,
      keywords: uniq(keywords)
        .filter((item) => !!item)
        .join(','),
      author: this.options()['site_author']
    });
  }

  private updateBreadcrumbs() {
    this.breadcrumbService.updateBreadcrumbs([]);
  }
}
