import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  BreadcrumbComponent,
  CommentComponent,
  JigsawComponent,
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
import { IconCalendarDateComponent, IconShareFillComponent } from 'common/icons';
import { TenantAppVo, Wallpaper } from 'common/interfaces';
import { NumberViewPipe } from 'common/pipes';
import {
  CommentService,
  CommonService,
  FavoriteService,
  OptionService,
  TenantAppService,
  UserService,
  VoteService,
  WallpaperJigsawService,
  WallpaperService
} from 'common/services';
import { cleanHtmlTag, truncateString } from 'common/utils';
import { isEmpty } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageService } from 'ng-zorro-antd/image';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';

@Component({
  selector: 'app-wallpaper-jigsaw',
  imports: [
    RouterLink,
    NzIconModule,
    NzButtonModule,
    DatePipe,
    NumberViewPipe,
    BreadcrumbComponent,
    JigsawComponent,
    WallpaperPrevNextComponent,
    WallpaperRelatedComponent,
    ShareModalComponent,
    CommentComponent,
    MakeMoneyComponent,
    IconCalendarDateComponent,
    IconShareFillComponent
  ],
  providers: [DestroyService, NzImageService],
  templateUrl: './wallpaper-jigsaw.component.html',
  styleUrl: './wallpaper-jigsaw.component.less'
})
export class WallpaperJigsawComponent implements OnInit {
  readonly commentType = CommentTargetType.WALLPAPER;

  isMobile = false;
  wallpaperId = '';
  wallpaper!: Wallpaper;
  lang = WallpaperLang.CN;
  downloading = false;
  voteLoading = false;
  favoriteLoading = false;
  shareVisible = false;
  shareUrl = '';

  get langParams() {
    return this.lang === WallpaperLang.CN ? {} : { lang: this.lang };
  }

  protected pageIndex = 'jigsaw';

  private isSignIn = false;
  private appInfo!: TenantAppVo;
  private options: OptionEntity = {};
  private wallpaperData!: Wallpaper;
  private isChanged = false;
  private isLangChanged = false;

  constructor(
    private readonly destroy$: DestroyService,
    private readonly route: ActivatedRoute,
    private readonly platform: PlatformService,
    private readonly userAgentService: UserAgentService,
    private readonly message: MessageService,
    private readonly imageService: NzImageService,
    private readonly commonService: CommonService,
    private readonly appConfigService: AppConfigService,
    private readonly metaService: MetaService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly userService: UserService,
    private readonly wallpaperService: WallpaperService,
    private readonly voteService: VoteService,
    private readonly favoriteService: FavoriteService,
    private readonly commentService: CommentService,
    private readonly wallpaperJigsawService: WallpaperJigsawService
  ) {
    this.isMobile = this.userAgentService.isMobile;
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

        const id = p.get('id')?.trim() || '';
        if (!id) {
          this.commonService.redirectToNotFound();
          return;
        }
        this.isChanged = this.wallpaperId !== id;
        this.wallpaperId = id;

        this.closeShareQrcode();

        const lang = <WallpaperLang>qp.get('lang')?.trim() || WallpaperLang.CN;
        this.isLangChanged = this.lang !== lang;
        this.lang = lang;

        if (this.isChanged) {
          this.getWallpaper();
          this.wallpaperService.updateActiveWallpaperId(this.wallpaperId);
          this.commentService.updateTargetId(this.wallpaperId);
        } else if (this.isLangChanged) {
          this.updateWallpaper(this.wallpaperData);
        }
      });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.isSignIn = !!user.id;

      if (this.platform.isBrowser) {
        this.shareUrl = this.commonService.getShareURL(user.id);
      }
    });
  }

  showWallpaper() {
    if (this.wallpaper) {
      this.imageService.preview([
        {
          src: this.wallpaper.url
        }
      ]);
    }
  }

  download(isUhd = false) {
    if (!this.isSignIn && isUhd) {
      this.showSigninModal();
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
      this.showSigninModal();
      return;
    }
    this.voteService
      .saveVote({
        targetId: this.wallpaperId,
        value: VoteValue.LIKE,
        type: VoteType.WALLPAPER
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.voteLoading = false;

        if (res.code === ResponseCode.SUCCESS) {
          this.message.success(Message.VOTE_SUCCESS);
          this.wallpaper.isVoted = true;
          this.wallpaper.wallpaperStat.likeCount = res.data.likes;
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
      this.showSigninModal();
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

  showSigninModal() {
    this.commonService.updateSigninModalVisible({
      visible: true,
      closable: true
    });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getWallpaper(): void {
    this.wallpaperService
      .getWallpaperById(this.wallpaperId, true)
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
    this.wallpaper = this.wallpaperService.transformWallpaper(wallpaper);
    if (this.lang === WallpaperLang.EN) {
      this.wallpaper.title = this.wallpaper.titleEn;
      this.wallpaper.copyright = this.wallpaper.copyrightEn;
      this.wallpaper.location = this.wallpaper.locationEn;
    }

    this.wallpaperJigsawService.updateActiveJigsawWallpaper(this.wallpaper);
    this.updatePageInfo();
    this.updateBreadcrumbs();
  }

  private updatePageInfo() {
    const titles: string[] = [this.wallpaper.copyright, '壁纸拼图', this.appInfo.name];
    let description = '';
    const fullStop = this.lang === WallpaperLang.EN ? '.' : '。';
    const comma = this.lang === WallpaperLang.EN ? ', ' : '，';
    const locationStr = this.wallpaper.location ? comma + this.wallpaper.location : '';

    description += `${this.wallpaper.copyright}${locationStr}`;
    description += description.endsWith(fullStop) ? '' : fullStop;
    if (this.lang === WallpaperLang.EN) {
      description += ' ';
    }
    const wallpaperDesc = truncateString(cleanHtmlTag(this.wallpaper.story), 140);

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description: `${description}${wallpaperDesc}`,
      keywords: this.options['jigsaw_keywords'],
      author: this.options['site_author']
    });
  }

  private updateBreadcrumbs() {
    const breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '壁纸拼图',
        tooltip: '壁纸拼图',
        url: '/',
        domain: 'jigsaw',
        isHeader: false
      },
      {
        label: this.wallpaper.copyright,
        tooltip: this.wallpaper.copyright,
        url: '.',
        isHeader: true
      }
    ];

    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
