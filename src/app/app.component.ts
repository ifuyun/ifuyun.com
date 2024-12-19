import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { filter, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { MSiderComponent } from './components/m-sider/m-sider.component';
import { COOKIE_KEY_UV_ID, MEDIA_QUERY_THEME_DARK } from './config/common.constant';
import { ResponseCode } from './config/response-code.enum';
import { Theme } from './enums/common';
import { ErrorState } from './interfaces/common';
import { TaxonomyNode } from './interfaces/taxonomy';
import { ForbiddenComponent } from './pages/error/forbidden/forbidden.component';
import { NotFoundComponent } from './pages/error/not-found/not-found.component';
import { ServerErrorComponent } from './pages/error/server-error/server-error.component';
import { CommonService } from './services/common.service';
import { ErrorService } from './services/error.service';
import { LogService } from './services/log.service';
import { OptionService } from './services/option.service';
import { PlatformService } from './services/platform.service';
import { SsrCookieService } from './services/ssr-cookie.service';
import { TaxonomyService } from './services/taxonomy.service';
import { TenantAppService } from './services/tenant-app.service';
import { UrlService } from './services/url.service';
import { UserAgentService } from './services/user-agent.service';
import { UserService } from './services/user.service';
import { generateUid } from './utils/helper';

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
  postTaxonomies: TaxonomyNode[] = [];
  errorState!: ErrorState;
  errorPage = false;
  isBodyCentered = false;
  siderVisible = false;

  private currentUrl = '';
  private initialized = false;
  private accessLogId = '';
  private bodyOffset = 0;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly platform: PlatformService,
    private readonly userAgentService: UserAgentService,
    private readonly cookieService: SsrCookieService,
    private readonly commonService: CommonService,
    private readonly urlService: UrlService,
    private readonly optionService: OptionService,
    private readonly errorService: ErrorService,
    private readonly userService: UserService,
    private readonly tenantAppService: TenantAppService,
    private readonly taxonomyService: TaxonomyService,
    private readonly logService: LogService
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
            domain: environment.cookie.domain,
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
    this.taxonomyService.getTaxonomies().subscribe((taxonomies) => (this.postTaxonomies = taxonomies));
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
