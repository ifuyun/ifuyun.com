import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';
import {
  AppConfigService,
  COOKIE_KEY_UV_ID,
  ErrorService,
  ErrorState,
  MEDIA_QUERY_THEME_DARK,
  PlatformService,
  ResponseCode,
  SsrCookieService,
  UrlService,
  UserAgentService
} from 'common/core';
import { Theme } from 'common/enums';
import { ForbiddenComponent, NotFoundComponent, ServerErrorComponent } from 'common/error';
import { CommonService, LogService, OptionService, TenantAppService, UserService } from 'common/services';
import { generateUid } from 'common/utils';
import { filter, tap } from 'rxjs/operators';
import { FooterComponent } from '../footer/footer.component';
import { GameService } from '../game/game.service';
import { HeaderComponent } from '../header/header.component';
import { MSiderComponent } from '../m-sider/m-sider.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    CommonModule,
    HeaderComponent,
    FooterComponent,
    NotFoundComponent,
    ForbiddenComponent,
    ServerErrorComponent,
    MSiderComponent
  ],
  providers: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less'
})
export class AppComponent implements OnInit, AfterViewInit {
  isMobile: boolean = false;
  errorState!: ErrorState;
  errorPage = false;
  isBodyCentered = false;
  siderVisible = false;

  private currentUrl = '';
  private initialized = false;
  private accessLogId = '';
  private bodyOffset = 0;
  private romURL = '';

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
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
    private readonly gameService: GameService
  ) {
    this.isMobile = this.userAgentService.isMobile;
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
              .logAccess(this.logService.parseAccessLog(this.initialized, this.currentUrl, isNew, this.accessLogId))
              .subscribe((res) => {
                if (res.code === ResponseCode.SUCCESS) {
                  this.accessLogId = res.data.logId || '';
                }
              });
          }
          this.currentUrl = (event as NavigationEnd).url;
        }
        this.initialized = true;
      });

    this.initTheme();
    this.initThemeListener();
    this.optionService.getOptions().subscribe();
    this.tenantAppService.getAppInfo().subscribe();
    this.userService.getLoginUser().subscribe();
    this.errorService.errorState$.subscribe((state) => {
      this.errorState = state;
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
    this.gameService.activeRomURL$.subscribe((romURL) => (this.romURL = romURL));
  }

  ngAfterViewInit(): void {
    if (this.platform.isBrowser) {
      window.addEventListener('pagehide', () => {
        this.logService.logLeave({
          logId: this.accessLogId
        });
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.logService.logLeave({
            logId: this.accessLogId
          });
        }
      });
    }
  }

  closeSider() {
    this.siderVisible = false;
    this.commonService.updateSiderVisible(false);
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
