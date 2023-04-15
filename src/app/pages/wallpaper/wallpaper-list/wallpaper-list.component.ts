import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, RouterLink } from '@angular/router';
import { isEmpty, omit, uniq } from 'lodash';
import { combineLatestWith, skipWhile, takeUntil } from 'rxjs';
import { environment as env } from '../../../../environments/environment';
import { BreadcrumbComponent } from '../../../components/breadcrumb/breadcrumb.component';
import { BreadcrumbService } from '../../../components/breadcrumb/breadcrumb.service';
import { EmptyComponent } from '../../../components/empty/empty.component';
import { MakeMoneyComponent } from '../../../components/make-money/make-money.component';
import { PageBarComponent } from '../../../components/page-bar/page-bar.component';
import { STORAGE_KEY_LIKED_WALLPAPER } from '../../../config/common.constant';
import { VoteType, VoteValue } from '../../../config/common.enum';
import { ResponseCode } from '../../../config/response-code.enum';
import { CommonService } from '../../../core/common.service';
import { DestroyService } from '../../../core/destroy.service';
import { MetaService } from '../../../core/meta.service';
import { PageComponent } from '../../../core/page.component';
import { PaginatorEntity } from '../../../core/paginator.interface';
import { PaginatorService } from '../../../core/paginator.service';
import { PlatformService } from '../../../core/platform.service';
import { UserAgentService } from '../../../core/user-agent.service';
import { OptionEntity } from '../../../interfaces/option.interface';
import { Guest } from '../../../interfaces/user.interface';
import { VoteEntity } from '../../../interfaces/vote.interface';
import { NumberViewPipe } from '../../../pipes/number-view.pipe';
import { OptionService } from '../../../services/option.service';
import { UserService } from '../../../services/user.service';
import { VoteService } from '../../../services/vote.service';
import { WallpaperListViewComponent } from '../wallpaper-list-view/wallpaper-list-view.component';
import { BING_DOMAIN } from '../wallpaper.constant';
import { Wallpaper, WallpaperLang, WallpaperListMode, WallpaperQueryParam } from '../wallpaper.interface';
import { WallpaperService } from '../wallpaper.service';

@Component({
  selector: 'app-wallpaper-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    BreadcrumbComponent,
    WallpaperListViewComponent,
    PageBarComponent,
    EmptyComponent,
    MakeMoneyComponent,
    NumberViewPipe
  ],
  providers: [DestroyService],
  templateUrl: './wallpaper-list.component.html',
  styleUrls: ['./wallpaper-list.component.less']
})
export class WallpaperListComponent extends PageComponent implements OnInit, AfterViewInit {
  isMobile = false;
  options: OptionEntity = {};
  page = 1;
  total = 0;
  lang!: WallpaperLang;
  mode!: WallpaperListMode;
  keyword = '';
  wallpapers: Wallpaper[] = [];
  paginatorData: PaginatorEntity | null = null;
  pageUrl = '';
  pageUrlParam: Params = {};
  voteLoadingMap: Record<string, boolean> = {};
  year = '';
  month = '';

  protected pageIndex = 'wallpaper';

  private pageSize = 10;
  private commentUser: Guest | null = null;

  constructor(
    private route: ActivatedRoute,
    private platform: PlatformService,
    private userAgentService: UserAgentService,
    private destroy$: DestroyService,
    private metaService: MetaService,
    private commonService: CommonService,
    private breadcrumbService: BreadcrumbService,
    private optionService: OptionService,
    private wallpaperService: WallpaperService,
    private paginator: PaginatorService,
    private voteService: VoteService,
    private userService: UserService
  ) {
    super();
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.updatePageOptions();
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        combineLatestWith(this.route.paramMap, this.route.queryParamMap),
        takeUntil(this.destroy$)
      )
      .subscribe(([options, params, queryParams]) => {
        this.options = options;
        this.pageSize = Number(this.options['wallpapers_per_page']) || 10;
        this.page = Number(queryParams.get('page')) || 1;
        this.year = params.get('year')?.trim() || '';
        this.month = params.get('month')?.trim() || '';
        this.keyword = queryParams.get('keyword')?.trim() || '';
        this.lang = <WallpaperLang>queryParams.get('lang')?.trim();
        this.mode = <WallpaperListMode>queryParams.get('mode')?.trim();
        this.pageUrlParam = omit({ ...this.route.snapshot.queryParams }, ['page']);
        if (this.year) {
          this.pageIndex = 'wallpaperArchive';
        }
        this.updateActivePage();
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
    this.voteService
      .saveVote(voteData)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.voteLoadingMap[wallpaper.wallpaperId] = false;
        if (res.code === ResponseCode.SUCCESS) {
          wallpaper.wallpaperLikes = res.data.likes;
          if (like) {
            wallpaper.wallpaperVoted = true;
            likedWallpapers.push(wallpaper.wallpaperId);
            localStorage.setItem(STORAGE_KEY_LIKED_WALLPAPER, uniq(likedWallpapers.filter((item) => !!item)).join(','));
          }
        }
      });
  }

  getLangParams(wallpaper: Wallpaper): Params {
    if (!this.lang) {
      return !!wallpaper.bingIdCn ? {} : { lang: WallpaperLang.EN };
    }
    return { lang: this.lang };
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
    if (this.year) {
      param.year = this.year;
      if (this.month) {
        param.month = this.month;
      }
    }
    this.wallpaperService
      .getWallpapers(param)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.page = res.page || 1;
        this.total = res.total || 0;
        this.updatePageInfo();
        this.updateBreadcrumb();

        const urlPrefix = env.production ? this.options['wallpaper_server'] : BING_DOMAIN;
        this.wallpapers = (res.list || []).map((item) => {
          let wallpaperLocation: string;
          let copyright: string;
          let story: string;
          if (this.lang === WallpaperLang.EN) {
            wallpaperLocation = item.wallpaperLocationEn || item.wallpaperLocation || 'Unknown';
            copyright = item.wallpaperCopyrightEn || item.wallpaperCopyright;
            story = item.wallpaperStoryEn || item.wallpaperStory;
          } else {
            wallpaperLocation = item.wallpaperLocation || item.wallpaperLocationEn || '未知';
            copyright = item.wallpaperCopyright || item.wallpaperCopyrightEn;
            story = item.wallpaperStory || item.wallpaperStoryEn;
          }
          return {
            ...item,
            wallpaperCopyright: copyright,
            wallpaperLocation,
            wallpaperStory: story,
            wallpaperUrl: urlPrefix + item.wallpaperUrl,
            wallpaperThumbUrl: urlPrefix + item.wallpaperThumbUrl
          };
        });
        if (this.platform.isBrowser) {
          this.wallpapers = this.wallpaperService.checkWallpaperVoteStatus(this.wallpapers);
        }
        this.paginatorData = this.paginator.getPaginator(this.page, this.total, this.pageSize);
        const urlSegments = this.route.snapshot.url.map((url) => url.path);
        if (urlSegments.length < 1 || urlSegments[0] === 'archive') {
          urlSegments.unshift('wallpaper');
        }
        this.pageUrl = `/${urlSegments.join('/')}`;
      });
  }

  private updatePageInfo() {
    const siteName = this.options['site_name'] || '';
    let description = '';
    const titles = ['高清壁纸', siteName];
    const keywords = (this.options['wallpaper_keywords'] || '').split(',');

    if (this.year) {
      const label = `${this.year}年${this.month ? this.month + '月' : ''}`;
      titles.unshift(label);
      description += label;
    }
    if (this.keyword) {
      titles.unshift(this.keyword, '搜索');
      description += `「${this.keyword}」高清壁纸搜索结果`;
      keywords.unshift(this.keyword);
    } else {
      if (description) {
        description += '高清壁纸';
      }
    }
    if (this.page > 1) {
      titles.unshift(`第${this.page}页`);
      if (description) {
        description += `(第${this.page}页)`;
      }
    }
    if (description) {
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
    const breadcrumbs = [
      {
        label: '壁纸',
        tooltip: '高清壁纸',
        url: '/wallpaper',
        isHeader: !this.year
      }
    ];
    if (this.year) {
      breadcrumbs.push(
        {
          label: '归档',
          tooltip: '壁纸归档',
          url: '/wallpaper/archive',
          isHeader: false
        },
        {
          label: `${this.year}年`,
          tooltip: `${this.year}年`,
          url: '/wallpaper/archive/' + this.year,
          isHeader: !this.month
        }
      );
      if (this.month) {
        breadcrumbs.push({
          label: `${parseInt(this.month, 10)}月`,
          tooltip: `${this.year}年${this.month}月`,
          url: `/wallpaper/archive/${this.year}/${this.month}`,
          isHeader: true
        });
      }
    }
    if (this.page > 1) {
      breadcrumbs.push({
        label: `第${this.page}页`,
        tooltip: `第${this.page}页`,
        url: '',
        isHeader: false
      });
    }
    this.breadcrumbService.updateBreadcrumb(breadcrumbs);
  }
}
