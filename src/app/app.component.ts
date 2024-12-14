import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { filter, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { COOKIE_KEY_UV_ID, MEDIA_QUERY_THEME_DARK } from './config/common.constant';
import { Theme } from './enums/common';
import { ErrorState } from './interfaces/common';
import { TaxonomyNode } from './interfaces/taxonomy';
import { ForbiddenComponent } from './pages/error/forbidden/forbidden.component';
import { NotFoundComponent } from './pages/error/not-found/not-found.component';
import { ServerErrorComponent } from './pages/error/server-error/server-error.component';
import { CommonService } from './services/common.service';
import { ErrorService } from './services/error.service';
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
    ServerErrorComponent
  ],
  providers: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less'
})
export class AppComponent implements OnInit {
  isMobile: boolean = false;
  postTaxonomies: TaxonomyNode[] = [];
  errorState!: ErrorState;
  errorPage = false;
  isBodyCentered = false;

  private currentUrl = '';

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
    private readonly taxonomyService: TaxonomyService
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
          // todo: log
          this.currentUrl = (event as NavigationEnd).url;
        }
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
