import { DatePipe, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  BreadcrumbComponent,
  CommentComponent,
  LoginModalComponent,
  MakeMoneyComponent,
  ShareModalComponent,
  WallpaperPrevNextComponent,
  WallpaperRelatedComponent
} from 'common/components';
import {
  AppConfigService,
  AppDomainConfig,
  BreadcrumbEntity,
  BreadcrumbService,
  DestroyService,
  Message,
  MessageService,
  MetaService,
  OptionEntity,
  PlatformService,
  ResponseCode,
  UserAgentService
} from 'common/core';
import { CommentObjectType, FavoriteType, VoteType, VoteValue, WallpaperLang } from 'common/enums';
import { TenantAppModel, Wallpaper } from 'common/interfaces';
import { NumberViewPipe, SafeHtmlPipe } from 'common/pipes';
import {
  AdsService,
  AdsStatus,
  CommentService,
  CommonService,
  FavoriteService,
  OptionService,
  TenantAppService,
  UserService,
  VoteService,
  WallpaperService
} from 'common/services';
import { filterHtmlTag, truncateString } from 'common/utils';
import { isEmpty } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageService } from 'ng-zorro-antd/image';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'app-wallpaper',
  imports: [
    NgIf,
    RouterLink,
    NzIconModule,
    NzButtonModule,
    DatePipe,
    SafeHtmlPipe,
    NumberViewPipe,
    BreadcrumbComponent,
    WallpaperPrevNextComponent,
    WallpaperRelatedComponent,
    ShareModalComponent,
    LoginModalComponent,
    CommentComponent,
    MakeMoneyComponent
  ],
  providers: [DestroyService, NzImageService],
  templateUrl: './wallpaper.component.html',
  styleUrl: './wallpaper.component.less'
})
export class WallpaperComponent implements OnInit {
  readonly commentType = CommentObjectType.WALLPAPER;

  isMobile = false;
  domains!: AppDomainConfig;
  wallpaperId = '';
  wallpaper!: Wallpaper;
  lang = WallpaperLang.CN;
  downloading = false;
  voteLoading = false;
  favoriteLoading = false;
  shareVisible = false;
  shareUrl = '';
  loginVisible = false;

  get langParams() {
    return this.lang === WallpaperLang.CN ? {} : { lang: this.lang };
  }

  get translateLangParams() {
    return this.lang === WallpaperLang.CN ? { lang: WallpaperLang.EN } : {};
  }

  protected pageIndex = 'wallpaper';

  private isSignIn = false;
  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private wallpaperData!: Wallpaper;
  private isChanged = false;
  private isLangChanged = false;
  private adsStatus: AdsStatus = AdsStatus.UNKNOWN;

  constructor(
    private readonly destroy$: DestroyService,
    private readonly route: ActivatedRoute,
    private readonly platform: PlatformService,
    private readonly userAgentService: UserAgentService,
    private readonly appConfigService: AppConfigService,
    private readonly message: MessageService,
    private readonly imageService: NzImageService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly userService: UserService,
    private readonly wallpaperService: WallpaperService,
    private readonly voteService: VoteService,
    private readonly favoriteService: FavoriteService,
    private readonly commentService: CommentService,
    private readonly adsService: AdsService
  ) {
    this.isMobile = this.userAgentService.isMobile;
    this.domains = this.appConfigService.apps;
  }

  ngOnInit(): void {
    this.updatePageIndex();

    combineLatest([
      this.tenantAppService.appInfo$,
      this.optionService.options$,
      this.route.paramMap,
      this.route.queryParamMap
    ])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        const { queryParamMap: qp, paramMap: p } = this.route.snapshot;

        this.appInfo = appInfo;
        this.options = options;

        const wid = p.get('wid')?.trim() || '';
        if (!wid) {
          this.commonService.redirectToNotFound();
          return;
        }
        this.isChanged = this.wallpaperId !== wid;
        this.wallpaperId = wid;

        this.closeLoginModal();
        this.closeShareQrcode();

        const lang = <WallpaperLang>qp.get('lang')?.trim() || WallpaperLang.CN;
        this.isLangChanged = this.lang !== lang;
        this.lang = lang;

        if (this.isChanged) {
          this.getWallpaper();
          this.wallpaperService.updateActiveWallpaperId(this.wallpaperId);
          this.commentService.updateObjectId(this.wallpaperId);
        } else if (this.isLangChanged) {
          this.updateWallpaper(this.wallpaperData);
        }
      });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.isSignIn = !!user.userId;

      if (this.platform.isBrowser) {
        this.shareUrl = this.commonService.getShareURL(user.userId);
      }
    });
    this.adsService.adsStatus$.pipe(takeUntil(this.destroy$)).subscribe((status) => {
      this.adsStatus = status;
    });
  }

  showWallpaper() {
    if (this.wallpaper) {
      this.imageService.preview([
        {
          src: this.wallpaper.wallpaperUrl
        }
      ]);
    }
  }

  download(isUhd = false) {
    if (!this.isSignIn && (isUhd || this.adsStatus === AdsStatus.BLOCKED)) {
      this.showLoginModal();
      return;
    }
    this.downloading = true;
    this.wallpaperService
      .getWallpaperDownloadUrl(this.wallpaperId, isUhd ? 1 : 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.downloading = false;
        if (res) {
          window.open(this.appConfigService.apiBase + res);
        }
      });
  }

  vote() {
    if (this.voteLoading || this.wallpaper.isVoted) {
      return;
    }
    if (!this.isSignIn) {
      this.showLoginModal();
      return;
    }
    this.voteService
      .saveVote({
        objectId: this.wallpaperId,
        value: VoteValue.LIKE,
        type: VoteType.WALLPAPER
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.voteLoading = false;

        if (res.code === ResponseCode.SUCCESS) {
          this.message.success(Message.VOTE_SUCCESS);
          this.wallpaper.isVoted = true;
          this.wallpaper.wallpaperLikes = res.data.likes;
        }
      });
  }

  showReward() {
    const urlPrefix = this.commonService.getCdnUrlPrefix();
    const previewRef = this.imageService.preview([
      {
        src: urlPrefix + '/assets/images/reward.jpg'
      }
    ]);
    this.commonService.paddingPreview(previewRef.previewInstance.imagePreviewWrapper);
  }

  addFavorite() {
    if (this.favoriteLoading || this.wallpaper.isFavorite) {
      return;
    }
    if (!this.isSignIn) {
      this.showLoginModal();
      return;
    }
    this.favoriteLoading = true;
    this.favoriteService
      .addFavorite(this.wallpaperId, FavoriteType.WALLPAPER)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.favoriteLoading = false;

        if (res.code === ResponseCode.SUCCESS || res.code === ResponseCode.FAVORITE_IS_EXIST) {
          this.message.success(Message.ADD_FAVORITE_SUCCESS);
          this.wallpaper.isFavorite = true;
        }
      });
  }

  showShareQrcode() {
    this.shareVisible = true;
  }

  closeShareQrcode() {
    this.shareVisible = false;
  }

  showLoginModal() {
    this.loginVisible = true;
  }

  closeLoginModal() {
    this.loginVisible = false;
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getWallpaper(): void {
    this.wallpaperService
      .getWallpaperById(this.wallpaperId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((wallpaper) => {
        if (!wallpaper) {
          this.commonService.redirectToNotFound();
          return;
        }
        this.wallpaperData = wallpaper;
        this.updateWallpaper(wallpaper);
      });
  }

  private updateWallpaper(wallpaper: Wallpaper): void {
    let hasTranslation: boolean;

    this.wallpaper = this.wallpaperService.transformWallpaper(wallpaper);
    if (this.lang === WallpaperLang.EN) {
      hasTranslation = this.wallpaper.isCn;

      this.wallpaper.wallpaperTitle = this.wallpaper.wallpaperTitleEn;
      this.wallpaper.wallpaperCopyright = this.wallpaper.wallpaperCopyrightEn;
      this.wallpaper.wallpaperStoryTitle = this.wallpaper.wallpaperStoryTitleEn;
      this.wallpaper.wallpaperStory = this.wallpaper.wallpaperStoryEn;
      this.wallpaper.wallpaperLocation = this.wallpaper.wallpaperLocationEn;
    } else {
      hasTranslation = this.wallpaper.isEn;
    }
    this.wallpaper.hasTranslation = hasTranslation;
    this.wallpaper.wallpaperCopyrightAuthor = wallpaper.wallpaperCopyrightAuthor.replace(/^©\s*/i, '');

    this.updatePageInfo();
    this.updateBreadcrumbs();
  }

  private updatePageInfo() {
    const titles: string[] = [this.wallpaper.wallpaperCopyright, '高清壁纸', this.appInfo.appName];
    let description = '';
    const fullStop = this.lang === WallpaperLang.EN ? '.' : '。';
    const comma = this.lang === WallpaperLang.EN ? ', ' : '，';
    const locationStr = this.wallpaper.wallpaperLocation ? comma + this.wallpaper.wallpaperLocation : '';

    description += `${this.wallpaper.wallpaperCopyright}${locationStr}`;
    description += description.endsWith(fullStop) ? '' : fullStop;
    if (this.lang === WallpaperLang.EN) {
      description += ' ';
    }
    const wallpaperDesc = truncateString(filterHtmlTag(this.wallpaper.wallpaperStory), 140);

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description: `${description}${wallpaperDesc}`,
      keywords: this.options['wallpaper_keywords'],
      author: this.options['site_author']
    });
  }

  private updateBreadcrumbs() {
    const breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '壁纸',
        tooltip: '高清壁纸',
        url: '/',
        domain: 'wallpaper',
        param: this.lang === WallpaperLang.EN ? { lang: WallpaperLang.EN } : {},
        isHeader: false
      },
      {
        label: this.wallpaper.wallpaperCopyright,
        tooltip: this.wallpaper.wallpaperCopyright,
        url: '.',
        domain: 'wallpaper',
        param: this.lang === WallpaperLang.EN ? { lang: WallpaperLang.EN } : {},
        isHeader: true
      }
    ];

    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
