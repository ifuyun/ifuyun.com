import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';
import {
  AppConfigService,
  COOKIE_KEY_TURNSTILE_ID,
  COOKIE_KEY_UV_ID,
  ErrorService,
  ErrorState,
  MEDIA_QUERY_THEME_DARK,
  OptionEntity,
  PageIndexInfo,
  PlatformService,
  ResponseCode,
  SsrCookieService,
  UrlService,
  UserAgentService
} from 'common/core';
import { PostScope, PostStatus, Theme } from 'common/enums';
import { ForbiddenComponent, NotFoundComponent, ServerErrorComponent } from 'common/error';
import { isAllowedCrawler } from 'common/middlewares';
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
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { filter, takeWhile, tap } from 'rxjs/operators';
import { BotChatComponent } from '../bot-chat/bot-chat.component';
import { FooterComponent } from '../footer/footer.component';
import { GameService } from '../game/game.service';
import { HeaderComponent } from '../header/header.component';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { MSiderComponent } from '../m-sider/m-sider.component';
import { TurnstileComponent } from '../turnstile/turnstile.component';
import { Post, Wallpaper } from 'common/interfaces';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    MSiderComponent,
    LoginModalComponent,
    BotChatComponent,
    NotFoundComponent,
    ForbiddenComponent,
    ServerErrorComponent,
    TurnstileComponent,
    NzButtonModule,
    NzTooltipModule,
    NzIconModule
  ],
  providers: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less'
})
export class AppComponent implements OnInit, AfterViewInit {
  readonly faviconUrl: string;

  isMobile = false;
  isSignIn = false;
  errorState!: ErrorState;
  errorPage = false;
  isBodyCentered = false;
  siderVisible = false;
  options: OptionEntity = {};
  indexInfo?: PageIndexInfo;
  post: Post | null = null;
  wallpaper: Wallpaper | null = null;
  loginVisible = false;
  chatVisible = false;
  conversationId = '';
  chatPrompt = '';
  isSuspicious = false;
  isLimited = false;

  get hostName() {
    return this.commonService.getHostName();
  }

  get adsImg() {
    return this.commonService.getCdnUrlPrefix() + '/assets/images/adimage.gif';
  }

  private currentUrl = '';
  private initialized = false;
  private accessLogId = '';
  private bodyOffset = 0;
  private romURL = '';
  private adsStatus: AdsStatus = AdsStatus.UNKNOWN;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
    private readonly message: NzMessageService,
    private readonly platform: PlatformService,
    private readonly userAgentService: UserAgentService,
    private readonly cookieService: SsrCookieService,
    private readonly commonService: CommonService,
    private readonly urlService: UrlService,
    private readonly errorService: ErrorService,
    private readonly appConfigService: AppConfigService,
    private readonly optionService: OptionService,
    private readonly userService: UserService,
    private readonly tenantAppService: TenantAppService,
    private readonly logService: LogService,
    private readonly gameService: GameService,
    private readonly postService: PostService,
    private readonly wallpaperService: WallpaperService,
    private readonly adsService: AdsService
  ) {
    this.isMobile = userAgentService.isMobile;
    this.faviconUrl = appConfigService.faviconUrl;
  }

  ngOnInit(): void {
    this.router.events
      .pipe(
        tap((re) => {
          if (re instanceof NavigationStart) {
            this.errorPage = re.url.startsWith('/error/');
            if (!this.errorPage) {
              this.errorService.hideError();
            }
            // 不需要判断 isBrowser，romURL 是在客户端中设置的
            if (this.romURL) {
              this.gameService.clean(this.romURL);
              this.gameService.updateActiveRomURL('');
            }

            this.isSuspicious = this.commonService.isSuspicious();
          }
        }),
        filter((re) => re instanceof NavigationEnd)
      )
      .subscribe((event) => {
        this.isBodyCentered = !!this.route.firstChild?.snapshot.data['centered'];

        let faId = this.cookieService.get(COOKIE_KEY_UV_ID);
        let isNew = false;
        if (!faId) {
          isNew = true;
          faId = generateUid(this.userAgentService.uaString);
          this.cookieService.set(COOKIE_KEY_UV_ID, faId, {
            path: '/',
            domain: this.appConfigService.cookieDomain,
            expires: 400
          });
        }

        const previous = this.currentUrl.split('#')[0];
        const current = (event as NavigationEnd).url.split('#')[0];
        if (previous !== current) {
          this.urlService.updateUrlHistory({
            previous: this.currentUrl,
            current: (event as NavigationEnd).url
          });
          if (this.platform.isBrowser) {
            this.logService
              .logAccess(
                this.logService.parseAccessLog({
                  initialized: this.initialized,
                  referrer: this.currentUrl,
                  isNew,
                  adsStatus: this.adsStatus,
                  logId: this.accessLogId
                })
              )
              .subscribe((res) => {
                if (res.code === ResponseCode.SUCCESS) {
                  const oldAccessLogId = this.accessLogId;

                  this.accessLogId = res.data.logId || '';
                  this.logAdsStatus({
                    oldLogId: oldAccessLogId
                  });
                }
              });
          }
          this.currentUrl = (event as NavigationEnd).url;

          this.logService.checkAccessLimit().subscribe((res) => {
            this.isLimited = !isAllowedCrawler(this.userAgentService.uaString) && res.limit;
          });
        }
        this.initialized = true;
      });

    this.initTheme();
    this.initThemeListener();
    this.optionService.getOptions().subscribe();
    this.tenantAppService.getAppInfo().subscribe();
    this.userService.getLoginUser().subscribe((user) => {
      this.isSignIn = !!user.userId;
    });
    this.optionService.options$.subscribe((options) => {
      this.options = options;
    });
    this.commonService.siderVisible$.subscribe((visible) => {
      if (this.platform.isBrowser) {
        if (visible) {
          this.bodyOffset = document.documentElement.scrollTop;
          document.documentElement.style.position = 'fixed';
          document.documentElement.style.top = `-${this.bodyOffset}px`;
        } else {
          document.documentElement.style.position = '';
          document.documentElement.style.top = '';
          window.scrollTo({
            top: this.bodyOffset,
            behavior: 'instant'
          });
        }
      }
      this.siderVisible = visible;
    });
    this.commonService.pageIndex$.subscribe((page) => {
      this.indexInfo = this.commonService.getPageIndexInfo(page);
      this.cdr.detectChanges();
    });
    this.postService.activePost$.subscribe((post) => {
      this.post = post;
    });
    this.wallpaperService.activeWallpaper$.subscribe((wallpaper) => {
      this.wallpaper = wallpaper;
    });
    this.gameService.activeRomURL$.subscribe((romURL) => (this.romURL = romURL));
    this.errorService.errorState$.subscribe((state) => {
      this.errorState = state;
    });

    if (this.platform.isBrowser) {
      this.adsService.adsStatus$
        .pipe(takeWhile((status) => status !== AdsStatus.DISABLED, true))
        .subscribe((status) => {
          const oldAdsStatus = this.adsStatus;

          this.adsStatus = status;
          this.logAdsStatus({
            oldStatus: oldAdsStatus
          });
        });
    }
  }

  ngAfterViewInit(): void {
    if (this.platform.isBrowser) {
      window.addEventListener('pagehide', () => {
        this.logService.logLeave(this.accessLogId);
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.logService.logLeave(this.accessLogId);
        }
      });
    }
  }

  closeSider() {
    this.siderVisible = false;
    this.commonService.updateSiderVisible(false);
  }

  showLoginModal() {
    this.loginVisible = true;
  }

  closeLoginModal() {
    this.loginVisible = false;
  }

  showChat() {
    if (!this.isSignIn) {
      this.showLoginModal();
      return;
    }
    if (!this.post && !this.wallpaper) {
      return;
    }
    if (this.post) {
      if (!!this.post.post.postLoginFlag || !!this.post.post.postPayFlag) {
        this.message.warning('会员或付费文章无法使用 AI 阅读助手功能');
        return;
      }
      if (this.post.post.postStatus !== PostStatus.PUBLISH || this.post.post.postScope !== PostScope.PUBLIC) {
        this.message.warning('非公开文章无法使用 AI 阅读助手功能');
        return;
      }
    }
    this.chatVisible = true;
  }

  closeChat() {
    this.chatPrompt = '';
    this.chatVisible = false;
  }

  verifyTurnstile(token: string | null) {
    if (!token) {
      return;
    }
    this.commonService.verifyTurnstile(token).subscribe((res) => {
      if (res.code === ResponseCode.SUCCESS && res.data.success) {
        this.cookieService.set(COOKIE_KEY_TURNSTILE_ID, res.data.turnstileId, {
          path: '/',
          domain: this.appConfigService.cookieDomain,
          expires: 0.5 / 24,
          secure: !this.appConfigService.isDev
        });

        this.isSuspicious = false;
      } else {
        this.commonService.redirectToForbidden();
      }
    });
  }

  verifyFailed(errCode: string | null) {
    if (errCode) {
      this.commonService.redirectToForbidden();
    }
  }

  checkAdsStatus(isLoaded: boolean) {
    this.adsService.updateAdsStatus(isLoaded ? AdsStatus.ENABLED : AdsStatus.BLOCKED);
  }

  private logAdsStatus(param: { oldLogId?: string; oldStatus?: AdsStatus }) {
    const { oldLogId, oldStatus } = param;

    // 同应用异步跳转直接合并在日志请求，无需额外请求
    if (!oldLogId && this.accessLogId && this.adsStatus && this.adsStatus !== oldStatus) {
      this.logService.logAdsStatus(this.accessLogId, this.adsStatus).subscribe(() => {});
    }
  }

  private initTheme() {
    const theme = this.commonService.getTheme();
    this.commonService.setTheme(theme);
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
