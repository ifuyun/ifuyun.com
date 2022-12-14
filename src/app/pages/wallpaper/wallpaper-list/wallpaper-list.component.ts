import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { isEmpty, omit, uniq } from 'lodash';
import { combineLatestWith, skipWhile, Subscription } from 'rxjs';
import { environment as env } from '../../../../environments/environment';
import { BreadcrumbEntity } from '../../../components/breadcrumb/breadcrumb.interface';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { STORAGE_KEY_LIKED_WALLPAPER } from '../../../config/common.constant';
import { VoteType, VoteValue } from '../../../config/common.enum';
import { ResponseCode } from '../../../config/response-code.enum';
import { CommonService } from '../../../core/common.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { PaginatorEntity } from '../../../core/paginator.interface';
import { PaginatorService } from '../../../core/paginator.service';
import { PlatformService } from '../../../core/platform.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { OptionEntity } from '../../../interfaces/option.interface';
import { Guest } from '../../../interfaces/user.interface';
import { OptionService } from '../../../services/option.service';
import { UserService } from '../../../services/user.service';
import { VoteEntity } from '../../post/vote.interface';
import { VoteService } from '../../post/vote.service';
import { BING_DOMAIN } from '../wallpaper.constant';
import { Wallpaper, WallpaperLang, WallpaperQueryParam } from '../wallpaper.interface';
import { WallpaperService } from '../wallpaper.service';

@Component({
  selector: 'app-wallpaper-list',
  templateUrl: './wallpaper-list.component.html',
  styleUrls: ['./wallpaper-list.component.less']
})
export class WallpaperListComponent extends PageComponent implements OnInit, AfterViewInit, OnDestroy {
  isMobile = false;
  options: OptionEntity = {};
  page = 1;
  lang = WallpaperLang.CN;
  keyword = '';
  wallpapers: Wallpaper[] = [];
  total = 0;
  paginatorData: PaginatorEntity | null = null;
  pageUrl = '/wallpaper';
  pageUrlParam: Params = {};
  voteLoadingMap: Record<string, boolean> = {};

  protected pageIndex = 'wallpaper';

  private readonly pageSize = 12;

  private breadcrumbs: BreadcrumbEntity[] = [];
  private commentUser: Guest | null = null;

  private optionsListener!: Subscription;
  private wallpapersListener!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private optionService: OptionService,
    private commonService: CommonService,
    private breadcrumbService: BreadcrumbService,
    private metaService: MetaService,
    private wallpaperService: WallpaperService,
    private paginator: PaginatorService,
    private platform: PlatformService,
    private voteService: VoteService,
    private userService: UserService,
    private userAgentService: UserAgentService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updateActivePage();
    this.updatePageOptions();
    this.optionsListener = this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        combineLatestWith(this.route.queryParamMap)
      )
      .subscribe(([options, queryParams]) => {
        this.options = options;
        this.page = Number(queryParams.get('page')) || 1;
        this.keyword = queryParams.get('keyword')?.trim() || '';
        this.lang = <WallpaperLang>queryParams.get('lang')?.trim() || WallpaperLang.CN;
        this.pageUrlParam = omit({ ...this.route.snapshot.queryParams }, ['page']);
        this.fetchWallpapers();
      });
  }

  ngAfterViewInit() {
    if (this.platform.isBrowser) {
      const commentUser = this.userService.getCommentUser();
      if (commentUser) {
        this.commentUser = { ...commentUser };
      }
    }
  }

  ngOnDestroy(): void {
    this.optionsListener.unsubscribe();
    this.wallpapersListener.unsubscribe();
  }

  voteWallpaper(wallpaper: Wallpaper, like = true) {
    const likedWallpapers = (localStorage.getItem(STORAGE_KEY_LIKED_WALLPAPER) || '').split(',');
    if (likedWallpapers.includes(wallpaper.wallpaperId) || this.voteLoadingMap[wallpaper.wallpaperId]) {
      return;
    }
    this.voteLoadingMap[wallpaper.wallpaperId] = true;
    const voteData: VoteEntity = {
      objectId: wallpaper.wallpaperId,
      value: like ? VoteValue.LIKE : VoteValue.DISLIKE,
      type: VoteType.WALLPAPER
    };
    if (this.commentUser && this.commentUser.name) {
      voteData.user = this.commentUser;
    }
    this.voteService.saveVote(voteData).subscribe((res) => {
      this.voteLoadingMap[wallpaper.wallpaperId] = false;
      if (res.code === ResponseCode.SUCCESS) {
        wallpaper.likes = res.data.likes;
        if (like) {
          wallpaper.liked = true;
          likedWallpapers.push(wallpaper.wallpaperId);
          localStorage.setItem(STORAGE_KEY_LIKED_WALLPAPER, uniq(likedWallpapers.filter((item) => !!item)).join(','));
        }
      }
    });
  }

  getQueryParams(lang: string): Params {
    if (this.keyword) {
      return { lang, keyword: this.keyword };
    }
    return { lang };
  }

  getLangParams(): Params {
    return this.lang === WallpaperLang.CN ? {} : { lang: this.lang };
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

  private fetchWallpapers() {
    const param: WallpaperQueryParam = {
      page: this.page,
      pageSize: this.pageSize
    };
    if (this.lang) {
      param.lang = this.lang;
    }
    if (this.keyword) {
      param.keyword = this.keyword;
    }
    this.wallpapersListener = this.wallpaperService.getWallpapers(param).subscribe((res) => {
      const urlPrefix = env.production ? this.options['wallpaper_server'] : BING_DOMAIN;
      this.wallpapers = (res.list || []).map((item) => {
        const wallpaperLocation = this.lang === WallpaperLang.CN ? item.location || '未知' : item.locationEn || 'Unknown';
        return {
          ...item,
          copyright: this.lang === WallpaperLang.CN ? item.copyright : item.copyrightEn,
          location: wallpaperLocation,
          url: urlPrefix + item.url,
          thumbUrl: urlPrefix + item.thumbUrl
        };
      });
      this.initWallpaperStatus(this.wallpapers);
      this.page = res.page || 1;
      this.total = res.total || 0;
      this.paginatorData = this.paginator.getPaginator(this.page, this.total, this.pageSize);
      this.updatePageInfo();
      this.updateBreadcrumb();
    });
  }

  private initWallpaperStatus(wallpapers: Wallpaper[]) {
    if (this.platform.isBrowser) {
      const likedWallpapers = (localStorage.getItem(STORAGE_KEY_LIKED_WALLPAPER) || '').split(',');
      wallpapers.forEach((item) => {
        likedWallpapers.includes(item.wallpaperId) && (item.liked = true);
      });
    }
  }

  private updatePageInfo() {
    const siteName = this.options['site_name'] || '';
    let description = '';
    const titles = ['高清壁纸', siteName];
    const keywords = (this.options['wallpaper_keywords'] || '').split(',');

    if (this.keyword) {
      titles.unshift(this.keyword, '搜索');
      description += `「${this.keyword}」高清壁纸搜索结果`;
      keywords.unshift(this.keyword);
    } else {
      description += '高清壁纸';
    }
    if (this.page > 1) {
      titles.unshift(`第${this.page}页`);
      description += `(第${this.page}页)`;
    }
    if (description === '高清壁纸') {
      description = '';
    } else {
      description += '。';
    }
    description += `${siteName}${this.options['wallpaper_description']}`;

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description,
      keywords: uniq(keywords).join(','),
      author: this.options['site_author']
    });
  }

  private updateBreadcrumb(): void {
    this.breadcrumbs = [
      {
        label: '壁纸',
        tooltip: '高清壁纸',
        url: '/wallpaper',
        isHeader: true
      }
    ];
    if (this.page > 1) {
      this.breadcrumbs.push({
        label: `第${this.page}页`,
        tooltip: `第${this.page}页`,
        url: '',
        isHeader: false
      });
    }
    this.breadcrumbService.updateCrumb(this.breadcrumbs);
  }
}
