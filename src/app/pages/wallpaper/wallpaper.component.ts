import { DatePipe, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageService } from 'ng-zorro-antd/image';
import { NzMessageService } from 'ng-zorro-antd/message';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { LoginModalComponent } from '../../components/login-modal/login-modal.component';
import { ShareModalComponent } from '../../components/share-modal/share-modal.component';
import { WallpaperPrevNextComponent } from '../../components/wallpaper-prev-next/wallpaper-prev-next.component';
import { WallpaperRelatedComponent } from '../../components/wallpaper-related/wallpaper-related.component';
import { COOKIE_KEY_USER_ID } from '../../config/common.constant';
import { Message } from '../../config/message.enum';
import { ResponseCode } from '../../config/response-code.enum';
import { FavoriteType } from '../../enums/favorite';
import { WallpaperLang } from '../../enums/wallpaper';
import { BreadcrumbEntity } from '../../interfaces/breadcrumb';
import { OptionEntity } from '../../interfaces/option';
import { TenantAppModel } from '../../interfaces/tenant-app';
import { Wallpaper } from '../../interfaces/wallpaper';
import { NumberViewPipe } from '../../pipes/number-view.pipe';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { CommonService } from '../../services/common.service';
import { DestroyService } from '../../services/destroy.service';
import { FavoriteService } from '../../services/favorite.service';
import { MetaService } from '../../services/meta.service';
import { OptionService } from '../../services/option.service';
import { PlatformService } from '../../services/platform.service';
import { SsrCookieService } from '../../services/ssr-cookie.service';
import { TenantAppService } from '../../services/tenant-app.service';
import { UserAgentService } from '../../services/user-agent.service';
import { UserService } from '../../services/user.service';
import { VoteService } from '../../services/vote.service';
import { WallpaperService } from '../../services/wallpaper.service';
import { filterHtmlTag, truncateString } from '../../utils/helper';

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
    LoginModalComponent
  ],
  providers: [DestroyService, NzImageService],
  templateUrl: './wallpaper.component.html',
  styleUrl: './wallpaper.component.less'
})
export class WallpaperComponent implements OnInit {
  isMobile = false;
  isSignIn = false;
  wallpaperId = '';
  wallpaper!: Wallpaper;
  isVoted = false;
  isFavorite = false;
  lang = WallpaperLang.CN;
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

  protected activePage = 'wallpaper';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private isChanged = false;
  private isLoaded = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly destroy$: DestroyService,
    private readonly imageService: NzImageService,
    private readonly message: NzMessageService,
    private readonly platform: PlatformService,
    private readonly userAgentService: UserAgentService,
    private readonly cookieService: SsrCookieService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly userService: UserService,
    private readonly wallpaperService: WallpaperService,
    private readonly voteService: VoteService,
    private readonly favoriteService: FavoriteService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngOnInit(): void {
    this.updateActivePage();

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
      .subscribe(([appInfo, options, p, qp]) => {
        this.appInfo = appInfo;
        this.options = options;

        const wid = p.get('wid')?.trim() || '';
        if (!wid) {
          this.commonService.redirectToNotFound();
          return;
        }
        this.isChanged = this.wallpaperId !== wid;
        this.wallpaperId = wid;
        this.lang = <WallpaperLang>qp.get('lang')?.trim() || WallpaperLang.CN;

        if (!this.isLoaded || this.isChanged) {
          this.wallpaperService.updateActiveWallpaperId(this.wallpaperId);
          this.getWallpaper();
          this.isLoaded = true;
        }
      });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.isSignIn = !!user.userId;

      if (this.platform.isBrowser) {
        const userId = user.userId || this.cookieService.get(COOKIE_KEY_USER_ID);
        const shareUrl = location.href.split('#')[0];
        const param = (shareUrl.includes('?') ? '&' : '?') + 'ref=qrcode' + (userId ? '&uid=' + userId : '');
        this.shareUrl = shareUrl + param;
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

  showReward() {
    const previewRef = this.imageService.preview([
      {
        src: '/assets/images/reward.jpg'
      }
    ]);
    this.commonService.paddingPreview(previewRef.previewInstance.imagePreviewWrapper);
  }

  addFavorite() {
    if (this.favoriteLoading || this.isFavorite) {
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
          this.isFavorite = true;
          this.message.success(Message.ADD_FAVORITE_SUCCESS);
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

  protected updateActivePage(): void {
    this.commonService.updateActivePage(this.activePage);
  }

  private getWallpaper(): void {
    this.wallpaperService
      .getWallpaperById(this.wallpaperId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((wallpaper) => {
        if (wallpaper) {
          this.isFavorite = wallpaper.isFavorite;
          this.isVoted = wallpaper.isVoted;

          const wallpaperPartial: Partial<Wallpaper> = {};
          let wallpaperLocation = '';
          let hasTranslation: boolean;
          let unknownLocation = '';
          if (this.lang === WallpaperLang.EN) {
            wallpaperLocation = wallpaper.wallpaperLocationEn || wallpaper.wallpaperLocation;
            unknownLocation = 'Unknown';
            hasTranslation = !!wallpaper.wallpaperStory;
            wallpaperPartial.wallpaperTitle = wallpaper.wallpaperTitleEn || wallpaper.wallpaperTitle;
            wallpaperPartial.wallpaperCopyright = wallpaper.wallpaperCopyrightEn || wallpaper.wallpaperCopyright;
            wallpaperPartial.wallpaperStoryTitle = wallpaper.wallpaperStoryTitleEn || wallpaper.wallpaperStoryTitle;
            wallpaperPartial.wallpaperStory = wallpaper.wallpaperStoryEn || wallpaper.wallpaperStory;
          } else {
            wallpaperLocation = wallpaper.wallpaperLocation || wallpaper.wallpaperLocationEn;
            unknownLocation = '未知';
            hasTranslation = !!wallpaper.wallpaperStoryEn;
            wallpaperPartial.wallpaperTitle = wallpaper.wallpaperTitle || wallpaper.wallpaperTitleEn;
            wallpaperPartial.wallpaperCopyright = wallpaper.wallpaperCopyright || wallpaper.wallpaperCopyrightEn;
            wallpaperPartial.wallpaperStoryTitle = wallpaper.wallpaperStoryTitle || wallpaper.wallpaperStoryTitleEn;
            wallpaperPartial.wallpaperStory = wallpaper.wallpaperStory || wallpaper.wallpaperStoryEn;
          }
          wallpaperPartial.wallpaperLocation = wallpaperLocation || unknownLocation;
          wallpaperPartial.hasTranslation = hasTranslation;

          this.wallpaper = {
            ...wallpaper,
            ...wallpaperPartial,
            wallpaperCopyrightAuthor: wallpaper.wallpaperCopyrightAuthor.replace(/^©\s*/i, '')
          };

          this.updatePageInfo();
          this.updateBreadcrumb();
        }
      });
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

  private updateBreadcrumb() {
    const breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '壁纸',
        tooltip: '高清壁纸',
        url: '/wallpaper',
        param: this.lang === WallpaperLang.EN ? { lang: WallpaperLang.EN } : {},
        isHeader: false
      },
      {
        label: this.wallpaper.wallpaperCopyright,
        tooltip: this.wallpaper.wallpaperCopyright,
        url: '.',
        param: this.lang === WallpaperLang.EN ? { lang: WallpaperLang.EN } : {},
        isHeader: true
      }
    ];

    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
