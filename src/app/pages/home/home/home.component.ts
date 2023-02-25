import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { isEmpty } from 'lodash';
import { combineLatestWith, skipWhile, takeUntil, tap } from 'rxjs';
import { environment as env } from '../../../../environments/environment';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { BLANK_IMAGE } from '../../../config/common.constant';
import { ResultList } from '../../../core/common.interface';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { PaginatorService } from '../../../core/paginator.service';
import { PlatformService } from '../../../core/platform.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { filterHtmlTag, truncateString } from '../../../helpers/helper';
import { OptionEntity } from '../../../interfaces/option.interface';
import { OptionService } from '../../../services/option.service';
import { Post } from '../../post/post.interface';
import { PostService } from '../../post/post.service';
import { BING_DOMAIN } from '../../wallpaper/wallpaper.constant';
import { Wallpaper, WallpaperLang } from '../../wallpaper/wallpaper.interface';
import { WallpaperService } from '../../wallpaper/wallpaper.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less'],
  providers: [DestroyService]
})
export class HomeComponent extends PageComponent implements OnInit {
  readonly blankImage = BLANK_IMAGE;

  isMobile = false;
  pageIndex = 'index';
  options: OptionEntity = {};
  keyword = '';
  postList: ResultList<Post> = {};
  wallpapers: Wallpaper[] = [];

  constructor(
    private route: ActivatedRoute,
    private platform: PlatformService,
    private userAgentService: UserAgentService,
    private destroy$: DestroyService,
    private metaService: MetaService,
    private commonService: CommonService,
    private breadcrumbService: BreadcrumbService,
    private optionService: OptionService,
    private postService: PostService,
    private paginator: PaginatorService,
    private wallpaperService: WallpaperService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updatePageOptions();
    this.updateActivePage();
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        combineLatestWith(this.route.queryParamMap),
        takeUntil(this.destroy$),
        tap(([, queryParams]) => {
          this.keyword = queryParams.get('keyword')?.trim() || '';
        })
      )
      .subscribe(([options]) => {
        this.options = options;
        this.updatePageInfo();
        this.fetchPosts();
        this.fetchWallpapers();
      });
  }

  getWallpaperLangParams(wallpaper: Wallpaper): Params {
    return !!wallpaper.bingIdCn ? {} : { lang: WallpaperLang.EN };
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

  private fetchPosts() {
    this.postService
      .getPosts({
        page: 1,
        sticky: 0
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.postList = res.postList || {};
      });
  }

  private fetchWallpapers() {
    this.wallpaperService
      .getWallpapers({
        page: 1,
        pageSize: 10,
        lang: [WallpaperLang.CN, WallpaperLang.EN]
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const urlPrefix = env.production ? this.options['wallpaper_server'] : BING_DOMAIN;
        this.wallpapers = (res.list || []).map((item) => {
          const wallpaperLocation = !!item.bingIdCn ? item.location || '未知' : item.locationEn || 'Unknown';
          return {
            ...item,
            copyright: item.copyright || item.copyrightEn,
            location: wallpaperLocation,
            story: truncateString(filterHtmlTag(item.story || item.storyEn), 140),
            url: urlPrefix + item.url,
            thumbUrl: urlPrefix + item.thumbUrl
          };
        });
        if (this.platform.isBrowser) {
          this.wallpapers = this.wallpaperService.checkWallpaperLikedStatus(this.wallpapers);
        }
      });
  }

  private updatePageInfo() {
    const titles = [this.options['site_slogan'], this.options['site_name']];

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description: this.options['site_description'],
      keywords: this.options['site_keywords'],
      author: this.options['site_author']
    });
  }
}
