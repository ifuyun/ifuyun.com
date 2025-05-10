import { DatePipe, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageService } from 'ng-zorro-antd/image';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from 'src/app/components/breadcrumb/breadcrumb.component';
import { CommentComponent } from 'src/app/components/comment/comment.component';
import { JigsawComponent } from 'src/app/components/jigsaw/jigsaw.component';
import { LoginModalComponent } from 'src/app/components/login-modal/login-modal.component';
import { MakeMoneyComponent } from 'src/app/components/make-money/make-money.component';
import { ShareModalComponent } from 'src/app/components/share-modal/share-modal.component';
import { WallpaperPrevNextComponent } from 'src/app/components/wallpaper-prev-next/wallpaper-prev-next.component';
import { WallpaperRelatedComponent } from 'src/app/components/wallpaper-related/wallpaper-related.component';
import { Message } from 'src/app/config/message.enum';
import { ResponseCode } from 'src/app/config/response-code.enum';
import { CommentObjectType } from 'src/app/enums/comment';
import { FavoriteType } from 'src/app/enums/favorite';
import { VoteType, VoteValue } from 'src/app/enums/vote';
import { WallpaperLang } from 'src/app/enums/wallpaper';
import { BreadcrumbEntity } from 'src/app/interfaces/breadcrumb';
import { OptionEntity } from 'src/app/interfaces/option';
import { TenantAppModel } from 'src/app/interfaces/tenant-app';
import { Wallpaper } from 'src/app/interfaces/wallpaper';
import { NumberViewPipe } from 'src/app/pipes/number-view.pipe';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { CommentService } from 'src/app/services/comment.service';
import { CommonService } from 'src/app/services/common.service';
import { DestroyService } from 'src/app/services/destroy.service';
import { FavoriteService } from 'src/app/services/favorite.service';
import { MessageService } from 'src/app/services/message.service';
import { MetaService } from 'src/app/services/meta.service';
import { OptionService } from 'src/app/services/option.service';
import { PlatformService } from 'src/app/services/platform.service';
import { TenantAppService } from 'src/app/services/tenant-app.service';
import { UserAgentService } from 'src/app/services/user-agent.service';
import { UserService } from 'src/app/services/user.service';
import { VoteService } from 'src/app/services/vote.service';
import { WallpaperJigsawService } from 'src/app/services/wallpaper-jigsaw.service';
import { WallpaperService } from 'src/app/services/wallpaper.service';
import { filterHtmlTag, truncateString } from 'src/app/utils/helper';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-wallpaper-jigsaw',
  imports: [
    NgIf,
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
    LoginModalComponent,
    CommentComponent,
    MakeMoneyComponent
  ],
  providers: [DestroyService, NzImageService],
  templateUrl: './wallpaper-jigsaw.component.html',
  styleUrl: './wallpaper-jigsaw.component.less'
})
export class WallpaperJigsawComponent implements OnInit {
  readonly commentType = CommentObjectType.WALLPAPER;

  isMobile = false;
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

  protected pageIndex = 'jigsaw';

  private isSignIn = false;
  private appInfo!: TenantAppModel;
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
    if (!this.isSignIn && isUhd) {
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
          window.open(environment.apiBase + res);
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
    const previewRef = this.imageService.preview([
      {
        src: '/assets/images/reward.jpg'
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
      this.wallpaper.wallpaperTitle = this.wallpaper.wallpaperTitleEn;
      this.wallpaper.wallpaperCopyright = this.wallpaper.wallpaperCopyrightEn;
      this.wallpaper.wallpaperLocation = this.wallpaper.wallpaperLocationEn;
    }

    this.wallpaperJigsawService.updateActiveWallpaper(this.wallpaper);
    this.updatePageInfo();
    this.updateBreadcrumbs();
  }

  private updatePageInfo() {
    const titles: string[] = [this.wallpaper.wallpaperCopyright, '壁纸拼图', this.appInfo.appName];
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
      keywords: this.options['jigsaw_keywords'],
      author: this.options['site_author']
    });
  }

  private updateBreadcrumbs() {
    const breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '壁纸拼图',
        tooltip: '壁纸拼图',
        url: '/jigsaw',
        isHeader: false
      },
      {
        label: this.wallpaper.wallpaperCopyright,
        tooltip: this.wallpaper.wallpaperCopyright,
        url: '.',
        isHeader: true
      }
    ];

    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
