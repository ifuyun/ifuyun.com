import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { filter } from 'rxjs';
import { environment as env } from '../environments/environment';
import { CLASS_BLOCK_SCROLL, COOKIE_KEY_UV_ID, MEDIA_QUERY_THEME_DARK } from './config/common.constant';
import { Theme } from './config/common.enum';
import { ResponseCode } from './config/response-code.enum';
import { CommonService } from './core/common.service';
import { PlatformService } from './core/platform.service';
import { UrlService } from './core/url.service';
import { UserAgentService } from './core/user-agent.service';
import { generateUid } from './helpers/helper';
import { TaxonomyNode } from './interfaces/taxonomy.interface';
import { UserService } from './pages/user/user.service';
import { LogService } from './services/log.service';
import { OptionService } from './services/option.service';
import { TaxonomyService } from './services/taxonomy.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit, AfterViewInit {
  isMobile = false;
  postTaxonomies: TaxonomyNode[] = [];
  siderOpen = false;

  private currentUrl = '';
  private initialized = false;
  private accessLogId = '';

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private router: Router,
    private platform: PlatformService,
    private userAgentService: UserAgentService,
    private cookieService: CookieService,
    private commonService: CommonService,
    private urlService: UrlService,
    private optionService: OptionService,
    private userService: UserService,
    private taxonomyService: TaxonomyService,
    private logService: LogService
  ) {
    this.isMobile = this.userAgentService.isMobile();
  }

  ngOnInit(): void {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      const previous = this.currentUrl.split('#')[0];
      const current = (event as NavigationEnd).url.split('#')[0];
      const userAgent = this.userAgentService.getUserAgentString();

      let waId = this.cookieService.get(COOKIE_KEY_UV_ID);
      let isNew = false;
      if (!waId) {
        isNew = true;
        waId = generateUid(userAgent);
        this.cookieService.set(COOKIE_KEY_UV_ID, waId, {
          path: '/',
          domain: env.cookie.domain,
          expires: 400
        });
      }
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
      this.siderOpen = false;
      this.onSiderOpenChange(false);
    });

    this.initTheme();
    this.initThemeListener();
    this.optionService.getOptions().subscribe();
    this.taxonomyService.getTaxonomies().subscribe((taxonomies) => (this.postTaxonomies = taxonomies));
    if (this.platform.isBrowser) {
      this.userService.getLoginUser().subscribe();
    }
  }

  ngAfterViewInit() {
    if (this.platform.isBrowser) {
      window.addEventListener('beforeunload', () => {
        this.saveLeaveLog();
      });
    }
  }

  toggleSiderOpen() {
    this.siderOpen = !this.siderOpen;
    this.onSiderOpenChange(this.siderOpen);
  }

  onSiderOpenChange(open: boolean) {
    const htmlNode = this.document.getElementsByTagName('html')[0];
    if (open) {
      htmlNode.classList.add(CLASS_BLOCK_SCROLL);
    } else {
      htmlNode.classList.remove(CLASS_BLOCK_SCROLL);
    }
  }

  private saveLeaveLog() {
    if (this.accessLogId) {
      this.logService
        .logLeave({
          logId: this.accessLogId
        })
        .subscribe();
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
