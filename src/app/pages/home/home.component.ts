import { DatePipe, NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { CarouselComponent } from '../../components/carousel/carousel.component';
import { WallpaperLang } from '../../enums/wallpaper';
import { OptionEntity } from '../../interfaces/option';
import { Post, PostEntity } from '../../interfaces/post';
import { TenantAppModel } from '../../interfaces/tenant-app';
import { Wallpaper } from '../../interfaces/wallpaper';
import { NumberViewPipe } from '../../pipes/number-view.pipe';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { CommonService } from '../../services/common.service';
import { DestroyService } from '../../services/destroy.service';
import { MetaService } from '../../services/meta.service';
import { OptionService } from '../../services/option.service';
import { PostService } from '../../services/post.service';
import { TenantAppService } from '../../services/tenant-app.service';
import { UserAgentService } from '../../services/user-agent.service';
import { WallpaperService } from '../../services/wallpaper.service';

@Component({
  selector: 'app-home',
  imports: [NgFor, RouterLink, DatePipe, NzButtonModule, NzIconModule, CarouselComponent, NumberViewPipe],
  providers: [DestroyService],
  templateUrl: './home.component.html',
  styleUrl: './home.component.less'
})
export class HomeComponent implements OnInit {
  isMobile = false;
  latestPosts: Post[] = [];
  hotPosts: PostEntity[] = [];
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
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly postService: PostService,
    private readonly wallpaperService: WallpaperService
  ) {
    this.isMobile = this.userAgentService.isMobile;
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
        this.fetchPosts();
        this.fetchWallpapers();
        if (!this.isMobile) {
          this.fetchHotPosts();
        }
      });
  }

  getWallpaperLangParams(isCn: boolean): Params {
    return isCn ? {} : { lang: WallpaperLang.EN };
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private fetchPosts() {
    this.postService
      .getPosts({
        page: 1,
        pageSize: this.isMobile ? 10 : 8,
        sticky: 0
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.latestPosts = res.postList?.list || [];
      });
  }

  private fetchWallpapers() {
    this.wallpaperService
      .getWallpapers({
        page: 1,
        pageSize: this.isMobile ? 10 : 8,
        lang: [WallpaperLang.CN, WallpaperLang.EN]
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.latestWallpapers = res.list || [];
      });
  }

  private fetchHotPosts() {
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
    const keywords: string[] = this.appInfo.keywords;

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description,
      keywords: uniq(keywords).join(','),
      author: this.options['site_author']
    });
  }

  private updateBreadcrumbs() {
    this.breadcrumbService.updateBreadcrumbs([]);
  }
}
