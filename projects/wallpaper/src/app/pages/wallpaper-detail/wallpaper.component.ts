import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  BreadcrumbComponent,
  CommentComponent,
  MakeMoneyComponent,
  ShareModalComponent,
  WallpaperPrevNextComponent,
  WallpaperRelatedComponent
} from 'common/components';
import {
  AppConfigService,
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
import { CommentTargetType, FavoriteType, VoteType, VoteValue, WallpaperLang } from 'common/enums';
import { IconCalendarDateComponent, IconDownloadComponent, IconShareFillComponent } from 'common/icons';
import { TenantAppVo, Wallpaper } from 'common/interfaces';
import { NumberViewPipe, SafeHtmlPipe } from 'common/pipes';
import {
  CommentService,
  CommonService,
  FavoriteService,
  OptionService,
  TenantAppService,
  UserService,
  VoteService,
  WallpaperService
} from 'common/services';
import { cleanHtmlTag, truncateString } from 'common/utils';
import { isEmpty } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageService } from 'ng-zorro-antd/image';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'app-wallpaper',
  imports: [
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
    CommentComponent,
    MakeMoneyComponent,
    IconCalendarDateComponent,
    IconDownloadComponent,
    IconShareFillComponent
  ],
  providers: [DestroyService, NzImageService],
  templateUrl: './wallpaper.component.html',
  styleUrl: './wallpaper.component.less'
})
export class WallpaperComponent implements OnInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly route = inject(ActivatedRoute);
  private readonly platform = inject(PlatformService);
  private readonly uaService = inject(UserAgentService);
  private readonly appConfigService = inject(AppConfigService);
  private readonly message = inject(MessageService);
  private readonly imageService = inject(NzImageService);
  private readonly commonService = inject(CommonService);
  private readonly metaService = inject(MetaService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);
  private readonly userService = inject(UserService);
  private readonly wallpaperService = inject(WallpaperService);
  private readonly voteService = inject(VoteService);
  private readonly favoriteService = inject(FavoriteService);
  private readonly commentService = inject(CommentService);

  readonly commentType = CommentTargetType.WALLPAPER;
  readonly isMobile = this.uaService.isMobile;
  readonly domains = this.appConfigService.apps;
  readonly wallpaper = signal<Wallpaper | null>(null);
  readonly lang = signal(WallpaperLang.CN);
  readonly downloading = signal(false);
  readonly favoriteLoading = signal(false);
  readonly shareVisible = signal(false);
  readonly shareUrl = signal('');
  readonly langParams = computed(() => {
    return this.lang() === WallpaperLang.CN ? {} : { lang: this.lang() };
  });
  readonly translateLangParams = computed(() => {
    return this.lang() === WallpaperLang.CN ? { lang: WallpaperLang.EN } : {};
  });
  readonly factTitle = computed(() => {
    return this.lang() === WallpaperLang.CN ? '你知道吗？' : 'Did you know?';
  });

  protected readonly pageIndex = 'wallpaper-detail';

  private readonly wallpaperId = signal('');
  private readonly voteLoading = signal(false);
  private readonly isSignIn = signal(false);
  private readonly appInfo = signal<TenantAppVo | null>(null);
  private readonly options = signal<OptionEntity>({});
  private readonly wallpaperData = signal<Wallpaper | null>(null);
  private readonly isChanged = signal(false);
  private readonly isLangChanged = signal(false);

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

        this.appInfo.set(appInfo);
        this.options.set(options);

        const id = p.get('id')?.trim() || '';
        if (!id) {
          this.commonService.redirectToNotFound();
          return;
        }
        this.isChanged.set(this.wallpaperId() !== id);
        this.wallpaperId.set(id);

        this.closeShareQrcode();

        const lang = <WallpaperLang>qp.get('lang')?.trim() || WallpaperLang.CN;
        this.isLangChanged.set(this.lang() !== lang);
        this.lang.set(lang);

        if (this.isChanged()) {
          this.getWallpaper();
          this.wallpaperService.updateActiveWallpaperId(this.wallpaperId());
          this.commentService.updateTargetId(this.wallpaperId());
        } else if (this.isLangChanged()) {
          this.updateWallpaper(this.wallpaperData()!);
        }
      });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.isSignIn.set(!!user.id);

      if (this.platform.isBrowser) {
        this.shareUrl.set(this.commonService.getShareURL(user.id));
      }
    });
  }

  showWallpaper() {
    if (this.wallpaper()) {
      this.imageService.preview([
        {
          src: this.wallpaper()!.url
        }
      ]);
    }
  }

  download(isUhd = false) {
    if (!this.isSignIn()) {
      this.showSigninModal();
      return;
    }
    this.downloading.set(true);
    this.wallpaperService
      .getWallpaperDownloadUrl(this.wallpaperId(), isUhd ? 1 : 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.downloading.set(false);
        if (res) {
          window.open(this.appConfigService.apiBase + res);
        }
      });
  }

  vote() {
    if (this.voteLoading() || this.wallpaper()?.isVoted) {
      return;
    }
    if (!this.isSignIn()) {
      this.showSigninModal();
      return;
    }
    this.voteService
      .saveVote({
        targetId: this.wallpaperId(),
        value: VoteValue.LIKE,
        type: VoteType.WALLPAPER
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.voteLoading.set(false);

        if (res.code === ResponseCode.SUCCESS) {
          this.message.success(Message.VOTE_SUCCESS);
          this.wallpaper.update((data) => ({
            ...data!,
            isVoted: true,
            wallpaperStat: {
              ...data!.wallpaperStat,
              likeCount: res.data.likeCount
            }
          }));
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
    if (this.favoriteLoading() || this.wallpaper()?.isFavorite) {
      return;
    }
    if (!this.isSignIn()) {
      this.showSigninModal();
      return;
    }
    this.favoriteLoading.set(true);
    this.favoriteService
      .addFavorite(this.wallpaperId(), FavoriteType.WALLPAPER)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.favoriteLoading.set(false);

        if (res.code === ResponseCode.SUCCESS || res.code === ResponseCode.FAVORITE_IS_EXIST) {
          this.message.success(Message.ADD_FAVORITE_SUCCESS);
          this.wallpaper.update((data) => ({
            ...data!,
            isFavorite: true
          }));
        }
      });
  }

  showShareQrcode() {
    this.shareVisible.set(true);
  }

  closeShareQrcode() {
    this.shareVisible.set(false);
  }

  showSigninModal() {
    this.commonService.updateSigninOptions({
      visible: true,
      closable: true
    });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getWallpaper(): void {
    this.wallpaperService
      .getWallpaperById(this.wallpaperId())
      .pipe(takeUntil(this.destroy$))
      .subscribe((wallpaper) => {
        if (!wallpaper) {
          this.commonService.redirectToNotFound();
          return;
        }
        this.wallpaperData.set(wallpaper);
        this.wallpaperService.updateActiveWallpaper(wallpaper);
        this.updateWallpaper(wallpaper);
      });
  }

  private updateWallpaper(wallpaper: Wallpaper): void {
    let hasTranslation: boolean;
    const curWallpaper = this.wallpaperService.transformWallpaper(wallpaper);

    if (this.lang() === WallpaperLang.EN) {
      hasTranslation = curWallpaper.isCn;

      curWallpaper.title = curWallpaper.titleEn;
      curWallpaper.copyright = curWallpaper.copyrightEn;
      curWallpaper.storyTitle = curWallpaper.storyTitleEn;
      curWallpaper.story = curWallpaper.storyEn;
      curWallpaper.fact = curWallpaper.factEn;
      curWallpaper.location = curWallpaper.locationEn;
    } else {
      hasTranslation = curWallpaper.isEn;
    }
    curWallpaper.hasTranslation = hasTranslation;
    curWallpaper.copyrightAuthor = wallpaper.copyrightAuthor.replace(/^©\s*/i, '');

    this.wallpaper.set(curWallpaper);

    this.updatePageInfo();
    this.updateBreadcrumbs();
  }

  private updatePageInfo() {
    const wallpaper = this.wallpaper()!;
    const titles: string[] = [wallpaper!.copyright, '高清壁纸', this.appInfo()!.name];
    let description = '';
    const fullStop = this.lang() === WallpaperLang.EN ? '.' : '。';
    const comma = this.lang() === WallpaperLang.EN ? ', ' : '，';
    const locationStr = wallpaper.location ? comma + wallpaper.location : '';

    description += `${wallpaper.copyright}${locationStr}`;
    description += description.endsWith(fullStop) ? '' : fullStop;
    if (this.lang() === WallpaperLang.EN) {
      description += ' ';
    }
    const wallpaperDesc = truncateString(cleanHtmlTag(wallpaper.story), 140);

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description: `${description}${wallpaperDesc}`,
      keywords: this.options()['wallpaper_keywords'],
      author: this.options()['site_author']
    });
  }

  private updateBreadcrumbs() {
    const breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '壁纸',
        tooltip: '高清壁纸',
        url: '/',
        domain: 'wallpaper',
        param: this.lang() === WallpaperLang.EN ? { lang: WallpaperLang.EN } : {},
        isHeader: false
      },
      {
        label: this.wallpaper()!.copyright,
        tooltip: this.wallpaper()!.copyright,
        url: '.',
        domain: 'wallpaper',
        param: this.lang() === WallpaperLang.EN ? { lang: WallpaperLang.EN } : {},
        isHeader: true
      }
    ];

    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
