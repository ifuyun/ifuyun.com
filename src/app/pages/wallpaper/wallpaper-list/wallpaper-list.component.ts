import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { isEmpty, omit, uniq } from 'lodash';
import { combineLatestWith, skipWhile, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { VoteType, VoteValue } from '../../../config/common.enum';
import { STORAGE_LIKED_WALLPAPER_KEY, WALLPAPER_KEYWORDS } from '../../../config/constants';
import { ResponseCode } from '../../../config/response-code.enum';
import { CommonService } from '../../../core/common.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { PaginatorEntity } from '../../../core/paginator.interface';
import { PaginatorService } from '../../../core/paginator.service';
import { PlatformService } from '../../../core/platform.service';
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
  readonly bingDomain = 'https://www.bing.com';
  readonly resolution = '1920x1080';

  options: OptionEntity = {};
  page = 1;
  lang = WallpaperLang.CN;
  keyword = '';
  showCrumb = false;
  wallpapers: Wallpaper[] = [];
  total = 0;
  paginatorData: PaginatorEntity | null = null;
  pageUrl = '/wallpapers';
  pageUrlParam: Params = {};
  voteLoadingMap: Record<string, boolean> = {};

  protected pageIndex = 'wallpaper';

  private commentUser: Guest | null = null;
  private optionsListener!: Subscription;
  private paramListener!: Subscription;
  private wallpapersListener!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private optionService: OptionService,
    private commonService: CommonService,
    private metaService: MetaService,
    private breadcrumbService: BreadcrumbService,
    private wallpaperService: WallpaperService,
    private paginator: PaginatorService,
    private platform: PlatformService,
    private voteService: VoteService,
    private userService: UserService
  ) {
    super();
  }

  ngOnInit(): void {
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
    this.updateActivePage();
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
    const likedWallpapers = (localStorage.getItem(STORAGE_LIKED_WALLPAPER_KEY) || '').split(',');
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
          localStorage.setItem(STORAGE_LIKED_WALLPAPER_KEY, uniq(likedWallpapers.filter((item) => !!item)).join(','));
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
        fullUrl: `${this.bingDomain}${item.urlBase}_${this.resolution}.${item.imageFormat}`,
        fullCopyrightUrl: `${this.bingDomain}${item.copyrightLink}`
      }));
      this.initWallpaperStatus(this.wallpapers);
      this.page = res.page || 1;
      this.total = res.total || 0;
      this.paginatorData = this.paginator.getPaginator(this.page, this.total);
      this.updatePageInfo();
    });
  }

  private initWallpaperStatus(wallpapers: Wallpaper[]) {
    if (this.platform.isBrowser) {
      const likedWallpapers = (localStorage.getItem(STORAGE_LIKED_WALLPAPER_KEY) || '').split(',');
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
    keywords.unshift(...WALLPAPER_KEYWORDS);

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
    description += `${siteName}高清壁纸频道提供高清壁纸、4K壁纸、必应壁纸查找、下载。`;

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description,
      keywords: uniq(keywords).join(','),
      author: this.options['site_author']
    });
  }
}
