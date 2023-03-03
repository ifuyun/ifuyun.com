import { DOCUMENT, NgClass, NgIf } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { BackTopComponent } from './components/back-top/back-top.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { SiderMobileComponent } from './components/sider-mobile/sider-mobile.component';
import { ToolboxComponent } from './components/toolbox/toolbox.component';
import { BLOCK_SCROLL_CLASS, MEDIA_QUERY_THEME_DARK } from './config/common.constant';
import { Theme } from './config/common.enum';
import { CommonService } from './core/common.service';
import { PlatformService } from './core/platform.service';
import { UrlService } from './core/url.service';
import { UserAgentService } from './core/user-agent.service';
import { TaxonomyNode } from './interfaces/taxonomy.interface';
import { LogService } from './services/log.service';
import { OptionService } from './services/option.service';
import { TaxonomyService } from './services/taxonomy.service';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
  // standalone: true,
  // imports: [
  //   NgIf,
  //   NgClass,
  //   RouterModule,
  //   HeaderComponent,
  //   FooterComponent,
  //   SiderMobileComponent,
  //   ToolboxComponent,
  //   BackTopComponent
  // ]
})
export class AppComponent implements OnInit {
  isMobile = false;
  taxonomies: TaxonomyNode[] = [];
  siderOpen = false;

  private currentUrl = '';
  private initialized = false;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private router: Router,
    private platform: PlatformService,
    private userAgentService: UserAgentService,
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
      if (previous !== current) {
        this.urlService.updateUrlHistory({
          previous: this.currentUrl,
          current: (event as NavigationEnd).url
        });
        if (this.platform.isBrowser) {
          this.logService.logAccess(this.logService.parseAccessLog(this.initialized, this.currentUrl)).subscribe();
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
    this.taxonomyService.getTaxonomies().subscribe((taxonomies) => (this.taxonomies = taxonomies));
    if (this.platform.isBrowser) {
      this.userService.getLoginUser().subscribe();
      this.commonService.updateJdUnionFlag(true);
    }
  }

  toggleSiderOpen() {
    this.siderOpen = !this.siderOpen;
    this.onSiderOpenChange(this.siderOpen);
  }

  onSiderOpenChange(open: boolean) {
    const htmlNode = this.document.getElementsByTagName('html')[0];
    if (open) {
      htmlNode.classList.add(BLOCK_SCROLL_CLASS);
    } else {
      htmlNode.classList.remove(BLOCK_SCROLL_CLASS);
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
