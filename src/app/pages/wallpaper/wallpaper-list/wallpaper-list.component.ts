import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { isEmpty, omit, uniq } from 'lodash';
import { combineLatestWith, skipWhile, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { VoteType, VoteValue } from '../../../config/common.enum';
import {
  BING_DOMAIN,
  DEFAULT_WALLPAPER_RESOLUTION,
  STORAGE_KEY_LIKED_WALLPAPER,
  WALLPAPER_PAGE_DESCRIPTION,
  WALLPAPER_PAGE_KEYWORDS
} from '../../../config/constants';
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
import { Wallpaper, WallpaperLang, WallpaperQueryParam } from '../wallpaper.interface';
import { WallpaperService } from '../wallpaper.service';

@Component({
  selector: 'app-wallpaper-list',
  templateUrl: './wallpaper-list.component.html',
  styleUrls: ['./wallpaper-list.component.less']
})
export class WallpaperListComponent extends PageComponent implements OnInit, AfterViewInit, OnDestroy {
  showCrumb = false;
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

  private readonly pageSize = 9;

  private commentUser: Guest | null = null;
  private optionsListener!: Subscription;
  private paramListener!: Subscription;
  private wallpapersListener!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private optionService: OptionService,
    private commonService: CommonService,
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
      .pipe(skipWhile((options) => isEmpty(options)))
      .subscribe((options) => {
        this.options = options;
      });
    this.paramListener = this.route.paramMap
      .pipe(
        combineLatestWith(this.route.queryParamMap),
        tap(([, queryParams]) => {
          this.page = Number(queryParams.get('page')) || 1;
          this.keyword = queryParams.get('keyword')?.trim() || '';
          this.lang = <WallpaperLang>queryParams.get('lang')?.trim() || WallpaperLang.CN;
          this.pageUrlParam = omit({ ...this.route.snapshot.queryParams }, ['page']);
        })
      )
      .subscribe(() => {
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
    this.paramListener.unsubscribe();
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

  private fetchWallpapers() {
    const param: WallpaperQueryParam = {
      page: this.page
    };
    if (this.lang) {
      param.lang = this.lang;
    }
    if (this.keyword) {
      param.keyword = this.keyword;
    }
    this.wallpapersListener = this.wallpaperService.getWallpapers(param).subscribe((res) => {
      this.wallpapers = (res.wallpapers || []).map((item) => ({
        ...item,
        fullUrl: `${BING_DOMAIN}${item.urlBase}_${DEFAULT_WALLPAPER_RESOLUTION}.${item.imageFormat}`,
        fullCopyrightUrl: `${BING_DOMAIN}${item.copyrightLink}`
      }));
      this.initWallpaperStatus(this.wallpapers);
      this.page = res.page || 1;
      this.total = res.total || 0;
      this.paginatorData = this.paginator.getPaginator(this.page, this.total, this.pageSize);
      this.updatePageInfo();
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
    const siteName: string = this.options['site_name'] || '';
    let description = '';
    const titles: string[] = ['高清壁纸', siteName];
    const keywords: string[] = (this.options['site_keywords'] || '').split(',');
    keywords.unshift(...WALLPAPER_PAGE_KEYWORDS);

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
    description += `${siteName}${WALLPAPER_PAGE_DESCRIPTION}`;

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description,
      keywords: uniq(keywords).join(','),
      author: this.options['site_author']
    });
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
