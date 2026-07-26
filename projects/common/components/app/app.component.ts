import { NgOptimizedImage } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';
import {
  AppConfigService,
  COOKIE_KEY_UV_ID,
  DestroyService,
  ErrorService,
  ErrorState,
  MEDIA_QUERY_THEME_DARK,
  PageIndexInfo,
  PlatformService,
  ResponseCode,
  SigninModalOptions,
  SsrCookieService,
  UrlService,
  UserAgentService
} from 'common/core';
import { LogActionType, LogTargetType, PostStatus, PostVisibility, Theme } from 'common/enums';
import { ForbiddenComponent, NotFoundComponent, ServerErrorComponent } from 'common/error';
import { IconMagicComponent, IconRssComponent, IconStarsComponent } from 'common/icons';
import { PostVo, Wallpaper } from 'common/interfaces';
import {
  AdsService,
  AdsStatus,
  CommonService,
  LogService,
  OptionService,
  PostService,
  TenantAppService,
  UserService,
  WallpaperService
} from 'common/services';
import { generateUid } from 'common/utils';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropdownDirective, NzDropdownMenuComponent } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageService } from 'ng-zorro-antd/image';
import { NzMenuDirective, NzMenuItemComponent } from 'ng-zorro-antd/menu';
import { NzMessageService } from 'ng-zorro-antd/message';
import { takeUntil } from 'rxjs';
import { filter, takeWhile, tap } from 'rxjs/operators';
import { AiChatComponent } from '../ai-chat/ai-chat.component';
import { FooterComponent } from '../footer/footer.component';
import { GameService } from '../game/game.service';
import { HeaderComponent } from '../header/header.component';
import { MSiderComponent } from '../m-sider/m-sider.component';
import { SigninModalComponent } from '../signin-modal/signin-modal.component';
import { WallpaperModalComponent } from '../wallpaper/wallpaper-modal/wallpaper-modal.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    MSiderComponent,
    SigninModalComponent,
    AiChatComponent,
    NotFoundComponent,
    ForbiddenComponent,
    ServerErrorComponent,
    NzButtonModule,
    NzIconModule,
    NzDropdownDirective,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzMenuItemComponent,
    IconStarsComponent,
    IconMagicComponent,
    IconRssComponent,
    WallpaperModalComponent,
    NgOptimizedImage
  ],
  providers: [DestroyService, NzImageService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less'
})
export class AppComponent implements OnInit, AfterViewInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly message = inject(NzMessageService);
  private readonly imageService = inject(NzImageService);
  private readonly platform = inject(PlatformService);
  private readonly uaService = inject(UserAgentService);
  private readonly cookieService = inject(SsrCookieService);
  private readonly commonService = inject(CommonService);
  private readonly urlService = inject(UrlService);
  private readonly errorService = inject(ErrorService);
  private readonly appConfigService = inject(AppConfigService);
  private readonly optionService = inject(OptionService);
  private readonly userService = inject(UserService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly logService = inject(LogService);
  private readonly gameService = inject(GameService);
  private readonly postService = inject(PostService);
  private readonly wallpaperService = inject(WallpaperService);
  private readonly adsService = inject(AdsService);

  readonly isMobile = this.uaService.isMobile;
  readonly faviconUrl = this.appConfigService.faviconUrl;
  readonly adsImg = this.commonService.getCdnUrlPrefix() + '/assets/images/adimage.gif';
  readonly errorState = signal<ErrorState | null>(null);
  readonly errorPage = signal(false);
  readonly isBodyCentered = signal(false);
  readonly siderVisible = signal(false);
  readonly indexInfo = signal<PageIndexInfo | null>(null);
  readonly post = signal<PostVo | null>(null);
  readonly wallpaper = signal<Wallpaper | null>(null);
  readonly chatVisible = signal(false);
  readonly conversationId = signal('');
  readonly chatPrompt = signal('');
  readonly wallpaperModalVisible = signal(false);
  readonly signinOptions = signal<SigninModalOptions>({
    visible: false,
    closable: true
  });

  private isSignIn = signal(false);
  private currentUrl = signal('');
  private initialized = signal(false);
  private accessLogId = signal('');
  private bodyOffset = signal(0);
  private romURL = signal('');
  private adsStatus = signal(AdsStatus.UNKNOWN);

  ngOnInit(): void {
    this.router.events
      .pipe(
        tap((re) => {
          if (re instanceof NavigationStart) {
            this.errorPage.set(re.url.startsWith('/error/'));
            if (!this.errorPage()) {
              this.errorService.hideError();
            }
            // 不需要判断 isBrowser，romURL 是在客户端中设置的
            if (this.romURL()) {
              this.gameService.clean(this.romURL());
              this.gameService.updateActiveRomURL('');
            }

            this.commonService.updateSigninOptions({
              visible: false,
              closable: true
            });
          }
        }),
        filter((re) => re instanceof NavigationEnd)
      )
      .subscribe((event) => {
        this.isBodyCentered.set(!!this.route.firstChild?.snapshot.data['centered']);

        let faId = this.cookieService.get(COOKIE_KEY_UV_ID);
        let isNew = false;
        if (!faId) {
          isNew = true;
          faId = generateUid(this.uaService.uaString);
          this.cookieService.set(COOKIE_KEY_UV_ID, faId, {
            path: '/',
            domain: this.appConfigService.cookieDomain,
            expires: 400
          });
        }

        const previous = this.currentUrl().split('#')[0];
        const current = (event as NavigationEnd).url.split('#')[0];
        if (previous !== current) {
          this.urlService.updateUrlHistory({
            previous: this.currentUrl(),
            current: (event as NavigationEnd).url
          });
          if (this.platform.isBrowser) {
            this.logService
              .logAccess(
                this.logService.buildAccessLog({
                  initialized: this.initialized(),
                  referrer: this.currentUrl(),
                  isNew,
                  adsStatus: this.adsStatus(),
                  logId: this.accessLogId()
                })
              )
              .subscribe((res) => {
                if (res.code === ResponseCode.SUCCESS) {
                  const oldAccessLogId = this.accessLogId();

                  this.accessLogId.set(res.data.logId || '');
                  this.logAdsStatus({
                    oldLogId: oldAccessLogId
                  });
                }
              });
          }
          this.currentUrl.set((event as NavigationEnd).url);
        }
        this.initialized.set(true);
      });

    this.initTheme();
    this.initThemeListener();
    this.optionService.getOptions().subscribe();
    this.tenantAppService.getAppInfo().subscribe();
    this.userService.getProfile().subscribe((user) => {
      this.isSignIn.set(!!user.id);
    });
    this.commonService.siderVisible$.subscribe((visible) => {
      if (this.platform.isBrowser) {
        if (visible) {
          this.bodyOffset.set(document.documentElement.scrollTop);

          document.documentElement.style.position = 'fixed';
          document.documentElement.style.top = `-${this.bodyOffset()}px`;
        } else {
          document.documentElement.style.position = '';
          document.documentElement.style.top = '';
          window.scrollTo({
            top: this.bodyOffset(),
            behavior: 'instant'
          });
        }
      }
      this.siderVisible.set(visible);
    });
    this.commonService.pageIndex$.subscribe((page) => {
      this.indexInfo.set(this.commonService.getPageIndexInfo(page));
      this.cdr.detectChanges();
    });
    this.commonService.signinOptions$.subscribe((signinOptions) => {
      this.signinOptions.set(signinOptions);
    });
    this.postService.activePost$.subscribe((post) => {
      this.post.set(post);
    });
    this.wallpaperService.activeWallpaper$.subscribe((wallpaper) => {
      this.wallpaper.set(wallpaper);
    });
    this.gameService.activeRomURL$.subscribe((romURL) => this.romURL.set(romURL));
    this.errorService.errorState$.subscribe((state) => {
      this.errorState.set(state);
    });

    if (this.platform.isBrowser) {
      this.adsService.adsStatus$
        .pipe(takeWhile((status) => status !== AdsStatus.DISABLED, true))
        .subscribe((status) => {
          const oldAdsStatus = this.adsStatus();

          this.adsStatus.set(status);

          this.logAdsStatus({
            oldStatus: oldAdsStatus
          });
        });
    }
  }

  ngAfterViewInit(): void {
    if (this.platform.isBrowser) {
      window.addEventListener('pagehide', () => {
        this.logService.logLeave(this.accessLogId());
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.logService.logLeave(this.accessLogId());
        }
      });
    }
  }

  closeSider() {
    this.siderVisible.set(false);
    this.commonService.updateSiderVisible(false);
  }

  showRedPacket() {
    const urlPrefix = this.commonService.getCdnUrlPrefix();
    const previewRef = this.imageService.preview([
      {
        src: urlPrefix + '/assets/images/red-packet.png'
      }
    ]);
    this.commonService.paddingPreview(previewRef.previewInstance.imagePreviewWrapper);

    this.logService
      .logAction({
        action: LogActionType.SHOW_RED_PACKET,
        targetType: LogTargetType.WIDGET
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  showWallpaperModal() {
    this.wallpaperModalVisible.set(true);

    this.logService
      .logAction({
        action: LogActionType.SHOW_WALLPAPER_MODAL,
        targetType: LogTargetType.WIDGET
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  closeWallpaperModal() {
    this.wallpaperModalVisible.set(false);
  }

  showWechatCard() {
    const urlPrefix = this.commonService.getCdnUrlPrefix();

    this.imageService.preview([
      {
        src: urlPrefix + '/assets/images/wechat-card.png'
      }
    ]);

    this.logService
      .logAction({
        action: LogActionType.SHOW_WECHAT_CARD,
        targetType: LogTargetType.WIDGET
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  openRSS(isWallpaper = false) {
    const rssUrl = this.appConfigService.apps[isWallpaper ? 'wallpaper' : 'blog'].url + '/rss.xml';

    this.logService
      .logAction({
        action: isWallpaper ? LogActionType.OPEN_WALLPAPER_RSS : LogActionType.OPEN_POST_RSS,
        targetType: LogTargetType.WIDGET
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();

    window.open(rssUrl);
  }

  showSigninModal(closable = true) {
    this.commonService.updateSigninOptions({
      visible: true,
      closable
    });
  }

  closeSigninModal() {
    this.commonService.updateSigninOptions({
      visible: false,
      closable: true
    });
  }

  showChat() {
    if (!this.isSignIn()) {
      this.showSigninModal();
      return;
    }
    const post = this.post();
    if (!post && !this.wallpaper) {
      return;
    }
    if (post) {
      if (post.visibility === PostVisibility.LOGIN_USER || !!post.isPaid) {
        this.message.warning('会员或付费文章无法使用 AI 阅读助手功能');
        return;
      }
      if (post.status !== PostStatus.PUBLISHED || post.visibility !== PostVisibility.PUBLIC) {
        this.message.warning('非公开文章无法使用 AI 阅读助手功能');
        return;
      }
    }
    this.chatVisible.set(true);
  }

  closeChat() {
    this.chatPrompt.set('');
    this.chatVisible.set(false);
  }

  checkAdsStatus(isLoaded: boolean) {
    this.adsService.updateAdsStatus(isLoaded ? AdsStatus.ENABLED : AdsStatus.BLOCKED);
  }

  private logAdsStatus(param: { oldLogId?: string; oldStatus?: AdsStatus }) {
    const { oldLogId, oldStatus } = param;

    // 同应用异步跳转直接合并在日志请求，无需额外请求
    if (!oldLogId && this.accessLogId() && this.adsStatus() && this.adsStatus() !== oldStatus) {
      this.logService.logAdsStatus(this.accessLogId(), this.adsStatus()).subscribe(() => {});
    }
  }

  private initTheme() {
    this.commonService.setTheme(this.commonService.getTheme());
  }

  private initThemeListener() {
    if (this.platform.isBrowser) {
      window.matchMedia(MEDIA_QUERY_THEME_DARK).addEventListener('change', (event) => {
        if (!this.commonService.isThemeCached()) {
          this.commonService.setTheme(event.matches ? Theme.Dark : Theme.Light);
        }
      });
    }
  }
}
